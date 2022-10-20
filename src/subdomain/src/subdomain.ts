import { ethers } from 'ethers'
import { TransactionResponse, Web3Provider } from '@ethersproject/providers'
import ContractABI from '../contracts/abi.json'
import { contract_address } from '../contracts/constants.js'
import { ErrorResponse } from '../utils/types'

export class Subdomain {
  private provider: Web3Provider | null = null
  private chainId: number | null = null
  private contractAddress = ''

  constructor(provider: Web3Provider, chainId: number) {
    this.provider = provider
    //this.chainId = chainId
    contract_address.forEach((contract) => {
      if (contract.chainId === chainId) {
        this.contractAddress = contract.address
      }
    })
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
