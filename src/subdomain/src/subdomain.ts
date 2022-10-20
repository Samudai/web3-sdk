import { ethers } from 'ethers'
import { TransactionResponse, Web3Provider } from '@ethersproject/providers'
import ContractABI from '../contracts/abi.json'
import { ErrorResponse } from '../utils/types'

export class Subdomain {
  private provider: Web3Provider | null = null
  private chainId: number | null = null
  private contractAddress = ''

  constructor(provider: Web3Provider) {
    this.provider = provider
    //this.chainId = chainId
    this.contractAddress = '0x56fCFB4eE23e703592Fb3c4c20D7EC2EEbC067c6'
  }

  claimSubdomain = async (
    username: string
  ): Promise<boolean | ErrorResponse> => {
    try {
      if (this.provider && this.contractAddress) {
        const signer = this.provider.getSigner()
        const contract = new ethers.Contract(
          this.contractAddress,
          ContractABI.abi,
          signer
        )
        const tx: TransactionResponse = await contract.claimSubdomain(username)
        await tx.wait()

        if (tx) {
          return true
        } else {
          return false
        }
      } else {
        return {
          error: 'Provider not found',
          message: 'Provider not found',
        }
      }
    } catch (err: any) {
      return {
        error: `${err}`,
        message: 'Error while claiming subdomain',
      }
    }
  }
}
