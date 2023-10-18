import { ethers } from 'ethers'
import {
  CANNOT_SET_RESOLVER,
  CANNOT_UNWRAP,
  CAN_EXTEND_EXPIRY,
  ENS_DOMAIN_NAME,
  ETHEREUM_MAINNET_RESOLVER,
  MAINNET_RPC_URL,
  OWNER_ADDRESS,
  PARENT_CANNOT_CONTROL,
  PROXY_CONTRACT_ADDRESS,
  PVT_KEY,
} from '../utils/constants'
import { ImplementationContractABI } from '../contracts/Contract_ABI'
const namehash = require('@ensdomains/eth-ens-namehash')
const contentHash = require('content-hash')
import { transaction } from '../utils/types'
import { IBundler, Bundler } from '@biconomy/bundler'
import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from '@biconomy/account'
import { ChainId } from '@biconomy/core-types'
import {
  IPaymaster,
  BiconomyPaymaster,
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from '@biconomy/paymaster'
import {
  ECDSAOwnershipValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
} from '@biconomy/modules'

export class ClaimSubdomain {
  private cid = ''
  private provider: ethers.providers.JsonRpcProvider
  private wallet: ethers.Wallet
  private contractInstance: ethers.Contract
  private parentHash = namehash.hash(ENS_DOMAIN_NAME)
  private bundler: IBundler
  private paymaster: IPaymaster

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(MAINNET_RPC_URL)
    this.wallet = new ethers.Wallet(PVT_KEY, this.provider)
    this.contractInstance = new ethers.Contract(
      PROXY_CONTRACT_ADDRESS,
      ImplementationContractABI,
      this.wallet
    )
    this.bundler = new Bundler({
      bundlerUrl:
        'https://bundler.biconomy.io/api/v2/1/hjJ79w0.jkL90oYh-iJkl-45ic-jdS9-nj789sb78Cv',
      chainId: ChainId.MAINNET,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    })
    this.paymaster = new BiconomyPaymaster({
      paymasterUrl:
        'https://paymaster.biconomy.io/api/v1/1/h8EwFOKGW.b97fed01-8bb9-42f5-932a-8137a995516a',
    })
  }

  createSmartAccount = async () => {
    try {
      const module = await ECDSAOwnershipValidationModule.create({
        signer: this.wallet,
        moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
      })
      const biconomySmartAccount = await BiconomySmartAccountV2.create({
        chainId: ChainId.MAINNET,
        bundler: this.bundler,
        paymaster: this.paymaster,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        defaultValidationModule: module,
        activeValidationModule: module,
      })
      console.log('address: ', await biconomySmartAccount.getAccountAddress())
      return biconomySmartAccount
    } catch (error) {
      throw new Error('Error creating smart account.')
    }
  }

  setCID = (cid: string) => {
    try {
      this.cid = cid
    } catch (error) {
      throw new Error('Error setting CID.')
    }
  }

  isSubdomainAvailable = async (subname: string): Promise<boolean> => {
    try {
      const subdomainName = subname + '.' + ENS_DOMAIN_NAME
      const subdomainHash = namehash.hash(subdomainName)
      const tx = await this.contractInstance.getData(subdomainHash)
      if (tx[0] === '0x0000000000000000000000000000000000000000') {
        return true
      } else {
        return false
      }
    } catch (error) {
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
        const minTx =
          await this.contractInstance.populateTransaction.createSubdomainWithContentHashV2(
            this.parentHash,
            subname,
            cidHash,
            fuses,
            ETHEREUM_MAINNET_RESOLVER,
            ownerAddress
          )
        const tx = {
          to: PROXY_CONTRACT_ADDRESS,
          data: minTx.data,
        }
        const userOp = await smartAccount.buildUserOp([tx])
        const biconomyPaymaster =
          smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>
        const paymasterServiceData: SponsorUserOperationDto = {
          mode: PaymasterMode.SPONSORED,
          smartAccountInfo: {
            name: 'BICONOMY',
            version: '2.0.0',
          },
        }
        const paymasterAndDataResponse =
          await biconomyPaymaster.getPaymasterAndData(
            userOp,
            paymasterServiceData
          )
        userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData
        const userOpResponse = await smartAccount.sendUserOp(userOp)
        const { receipt } = await userOpResponse.wait(1)
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
    } catch (error) {
      throw new Error('Error claiming the subdomain.')
    }
  }
}
