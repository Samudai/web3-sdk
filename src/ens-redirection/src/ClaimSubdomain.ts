import { ethers } from 'ethers'
import namehash from '@ensdomains/eth-ens-namehash'
import contentHash from 'content-hash'
import {
  CANNOT_SET_RESOLVER,
  CANNOT_UNWRAP,
  CAN_EXTEND_EXPIRY,
  ENS_DOMAIN_NAME,
  MAINNET,
  PARENT_CANNOT_CONTROL,
  PVT_KEY,
} from '../utils/constants'
import { ImplementationContractABI } from '../contracts/Contract_ABI'
import { transaction } from '../utils/types'
import { createSmartAccountClient, PaymasterMode } from '@biconomy/account'

export class ClaimSubdomain {
  private cid = ''
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private contractInstance: ethers.Contract
  private parentHash = namehash.hash(ENS_DOMAIN_NAME)

  constructor() {
    this.provider = new ethers.JsonRpcProvider(MAINNET.RPC_URL)
    this.wallet = new ethers.Wallet(PVT_KEY, this.provider)
    this.contractInstance = new ethers.Contract(
      MAINNET.PROXY_CONTRACT_ADDRESS,
      ImplementationContractABI,
      this.wallet
    )
  }

  createSmartAccount = async () => {
    try {
      // Biconomy v4: the split Bundler/Paymaster/ECDSA-module packages are
      // consolidated into a single client. ECDSA validation is the default
      // module, so it no longer needs to be created explicitly.
      const biconomySmartAccount = await createSmartAccountClient({
        signer: this.wallet,
        bundlerUrl: MAINNET.BUNDLER_URL,
        paymasterUrl: MAINNET.PAYMASTER_URL,
        chainId: 1,
      })
      console.log('address: ', await biconomySmartAccount.getAccountAddress())
      return biconomySmartAccount
    } catch {
      throw new Error('Error creating smart account.')
    }
  }

  setCID = (cid: string) => {
    try {
      this.cid = cid
    } catch {
      throw new Error('Error setting CID.')
    }
  }

  isSubdomainAvailable = async (subname: string): Promise<boolean> => {
    try {
      const subdomainName = subname + '.' + ENS_DOMAIN_NAME
      const subdomainHash = namehash.hash(subdomainName)
      const tx = await (this.contractInstance as any).getData(subdomainHash)
      if (tx[0] === '0x0000000000000000000000000000000000000000') {
        return true
      } else {
        return false
      }
    } catch {
      throw new Error('Error finding the availability of subdomain.')
    }
  }

  claimSubdomain = async (
    subname: string,
    ownerAddress: string
  ): Promise<transaction> => {
    try {
      const isAvailable = await this.isSubdomainAvailable(subname)
      if (isAvailable === true && subname !== '') {
        const smartAccount = await this.createSmartAccount()
        const cidHash = '0x' + contentHash.fromIpfs(this.cid)
        const fuses =
          PARENT_CANNOT_CONTROL |
          CANNOT_UNWRAP |
          CANNOT_SET_RESOLVER |
          CAN_EXTEND_EXPIRY
        const minTx = await (
          this.contractInstance as any
        ).createSubdomainWithContentHashV2.populateTransaction(
          this.parentHash,
          subname,
          cidHash,
          fuses,
          MAINNET.RESOLVER,
          ownerAddress
        )
        const tx = {
          to: MAINNET.PROXY_CONTRACT_ADDRESS,
          data: minTx.data,
        }
        // Biconomy v4: build + sponsor + send is a single call.
        const userOpResponse = await smartAccount.sendTransaction(tx, {
          paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        })
        const { receipt } = await userOpResponse.wait()
        return {
          transactionHash: receipt.transactionHash,
          success: true,
        }
      } else {
        return {
          transactionHash: '',
          success: false,
        }
      }
    } catch {
      throw new Error('Error claiming the subdomain.')
    }
  }
}
