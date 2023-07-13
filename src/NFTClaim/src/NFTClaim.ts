import { ethers } from 'ethers'
import { TransactionResponse, Web3Provider } from '@ethersproject/providers'
import ContractABI from '../contracts/abi.json'
import { ErrorResponse } from '../utils/types'
import axios from 'axios'
import { GatewayURL } from '../utils/constants'
// import { initFunction } from '../../biconomy'

export class NFTClaim {
  private chainId: number | null = null
  private contractAddress = ''
  private gatewayURL = ''
  constructor(env: string) {
    //this.chainId = chainId
    this.gatewayURL = GatewayURL.find((item) => item.env === env)?.url || ''
    this.contractAddress = '0x1376BEC5669cC194255231A27a333396bBC93368'
  }

  claimNFT = async (
    provider: Web3Provider,
    phase?: number
    // jwt: string
  ): Promise<boolean> => {
    try {
      if (provider && this.contractAddress) {
        // const smartAccount = await initFunction(provider)

        const signer = provider.getSigner()
        const address = await signer.getAddress()
        const contract = new ethers.Contract(
          this.contractAddress,
          ContractABI,
          signer
        )

        // /**
        //  * @param  {uint256} phase - phase number(0,1,2,3 ...)
        //  * @param  {uint64} 1 - quantity of NFTs to mint
        //  */

        // const erc20Interface = new ethers.utils.Interface([
        //   'function mintPhase(uint256 phaseIndex, uint64 quantity)',
        // ])

        // // Encode an ERC-20 token transfer to recipientAddress of the specified amount
        // const encodedData = erc20Interface.encodeFunctionData('mintPhase', [
        //   phase,
        //   1,
        // ])

        // const tx = {
        //   to: this.contractAddress, // destination smart contract address
        //   data: encodedData,
        // }

        const tx: TransactionResponse = await contract.mintPhase(phase, 1)

        // // Optional: Transaction subscription. One can subscribe to various transaction states
        // // Event listener that gets triggered once a hash is generetaed
        // smartAccount.on('txHashGenerated', (response: any) => {
        //   console.log('txHashGenerated event received via emitter', response)
        // })
        // smartAccount.on('onHashChanged', (response: any) => {
        //   console.log('onHashChanged event received via emitter', response)
        // })
        // // Event listener that gets triggered once a transaction is mined
        // smartAccount.on('txMined', (response: any) => {
        //   console.log('txMined event received via emitter', response)
        // })
        // // Event listener that gets triggered on any error
        // smartAccount.on('error', (response: any) => {
        //   console.log('error event received via emitter', response)
        // })

        // Sending gasless transaction
        // const txResponse = await smartAccount.sendTransaction({
        //   transaction: tx,
        // })
        // console.log('userOp hash', txResponse.hash)
        // If you do not subscribe to listener, one can also get the receipt like shown below
        // const txReciept = await txResponse.wait()
        // console.log('Tx hash', txReciept.transactionHash)

        // DONE! You just sent a gasless transaction

        await tx.wait()

        if (tx) {
          return true
        } else {
          return false
        }
      } else {
        throw new Error('Invalid provider or contract address')
      }
    } catch (err: any) {
      throw err
    }
  }
}
