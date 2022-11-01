import { ethers } from 'ethers'
import { TransactionResponse, Web3Provider } from '@ethersproject/providers'
import ContractABI from '../contracts/abi.json'
import { ErrorResponse } from '../utils/types'

export class Subdomain {
  private chainId: number | null = null
  private contractAddress = ''

  constructor() {
    //this.chainId = chainId
    this.contractAddress = '0x125ff9e0F79371C67512A002d7890aF2aD9CeA09'
  }

  claimSubdomain = async (
    username: string,
    provider: Web3Provider
  ): Promise<boolean | ErrorResponse> => {
    try {
      if (provider && this.contractAddress) {
        const signer = provider.getSigner()
        const address = await signer.getAddress()
        const contract = new ethers.Contract(
          this.contractAddress,
          ContractABI,
          signer
        )

        const message = JSON.stringify({
          address: address,
          timestamp: Date.now(),
          message: 'I am claiming this subdomain',
        })
        const encoded = ethers.utils.solidityKeccak256(['string'], [message])

        const signature = await signer.signMessage(
          ethers.utils.arrayify(encoded)
        )

        const tx: TransactionResponse = await contract.claimSubdomain(
          username,
          message,
          signature
        )
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
