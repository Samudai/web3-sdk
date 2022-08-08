import { AddressZero } from '@ethersproject/constants'
import { Web3Provider } from '@ethersproject/providers'
import Safe from '@gnosis.pm/safe-core-sdk'
import { SafeSignature } from '@gnosis.pm/safe-core-sdk-types'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import axios from 'axios'
import { ethers } from 'ethers'
import {
  ErrorResponse,
  MultisigTransactionResponse,
  SafeTransactionResponse,
  SafeTransactions,
  SafeTransactionTemplate,
} from '../utils/types'

export class Gnosis {
  private safeAddress = ''
  private provider: Web3Provider | null = null
  private chainId = 0
  private etherAdapter: EthersAdapter | null = null
  private EIP712_SAFE_TX_TYPE = {
    SafeTx: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
      { type: 'bytes', name: 'data' },
      { type: 'uint8', name: 'operation' },
      { type: 'uint256', name: 'safeTxGas' },
      { type: 'uint256', name: 'baseGas' },
      { type: 'uint256', name: 'gasPrice' },
      { type: 'address', name: 'gasToken' },
      { type: 'address', name: 'refundReceiver' },
      { type: 'uint256', name: 'nonce' },
    ],
  }

  /**
   *
   * @param provider Web3Provider - The provider to use for interacting with the Gnosis Safe
   * @param chainId number - The chain ID of the Wallet
   */
  constructor(provider: Web3Provider, chainId: number) {
    this.provider = provider
    this.chainId = chainId
  }

  private buildSafeTx = (template: SafeTransactionTemplate) => {
    return {
      to: template.to,
      value: template.value || 0,
      data: template.data || '0x',
      operation: template.operation || 0,
      safeTxGas: template.safeTxGas || 0,
      baseGas: template.baseGas || 0,
      gasPrice: template.gasPrice || 0,
      gasToken: template.gasToken || AddressZero,
      refundReceiver: template.refundReceiver || AddressZero,
      nonce: template.nonce,
    }
  }

  /**
   *
   * @param baseTx SafeTransactionTemplate - The base transaction template to use for the signature
   */
  private estimateSafeTx = async (baseTx: any) => {
    try {
      const result = await axios.post(
        `https://safe-relay.rinkeby.gnosis.io/api/v2/safes/${this.safeAddress}/transactions/estimate/`,
        {
          to: baseTx.to,
          value: baseTx.value,
          data: baseTx.data,
          operation: baseTx.operation,
          gasToken: baseTx.gasToken,
        }
      )
      return result.data
    } catch (err) {
      console.log(err)
    }
  }

  private proposeTx = async (
    safeTx: any,
    safeTxHash: string,
    signature: SafeSignature
  ) => {
    try {
      const data = {
        ...safeTx,
        contractTransactionHash: safeTxHash,
        sender: signature.signer,
        signature: signature.data,
      }
      const res = await axios.post(
        `https://safe-transaction.rinkeby.gnosis.io/api/v1/safes/${this.safeAddress}/multisig-transactions/`,
        data
      )
      return res.data
    } catch (e) {
      console.log(e)
    }
  }

  /**
   *
   * @param chainId number - The chain ID of the Wallet
   * @param safeTx any - The SafeTransactionTemplate to use for the signature
   * @returns string - The transaction hash of the proposed transaction
   */
  private getTransactionHash = (chainId: number, safeTx: any): string => {
    const safeTxHash = ethers.utils._TypedDataEncoder.hash(
      {
        chainId: chainId,
        verifyingContract: this.safeAddress,
      },
      this.EIP712_SAFE_TX_TYPE,
      safeTx
    )
    return safeTxHash
  }

  /**
   * Function to create gnosis transaction
   * @param safeAddress string - The address of the Gnosis Safe
   * @param receiverAddress string - The address of the receiver
   * @param paymentValueInWei string - The amount of payment in Wei
   * @returns SafeTransactionResponse - The response from the Gnosis Safe
   */
  gnosisInit = async (
    safeAddress: string,
    receiverAddress: string,
    paymentValueInWei: string
  ): Promise<SafeTransactionResponse | ErrorResponse> => {
    try {
      this.safeAddress = safeAddress

      if (this.provider) {
        const safeOwner = await this.provider.getSigner(0)

        //Create Ethers Adapter

        this.etherAdapter = new EthersAdapter({
          ethers,
          signer: safeOwner,
        })

        const safeSdk: Safe = await Safe.create({
          ethAdapter: this.etherAdapter,
          safeAddress: this.safeAddress,
        })

        const safeTx = this.buildSafeTx({
          to: ethers.utils.getAddress(receiverAddress),
          value: paymentValueInWei,
          data: '0x',
          operation: 0,
          safeTxGas: 0,
          nonce: 0,
        })

        //Step 1: Estimate SafeTx

        const estimatedSafeTx = await this.estimateSafeTx(safeTx)

        safeTx.safeTxGas = estimatedSafeTx.safeTxGas
        safeTx.nonce =
          estimatedSafeTx.lastUsedNonce === null
            ? 0
            : estimatedSafeTx.lastUsedNonce + 1

        //Step 2: get safetx hash
        const safeTxHash = this.getTransactionHash(this.chainId, safeTx)

        //Step 3: sign safeTxHash
        const signature = await safeSdk.signTransactionHash(safeTxHash)

        //Step 4: propose safeTx
        const proposedSafeTx = await this.proposeTx(
          safeTx,
          safeTxHash,
          signature
        )

        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: proposedSafeTx,
        }

        return data
      } else {
        return {
          message: 'Something went wrong while creating Gnosis Transaction',
          error: 'Provider is null',
        }
      }
    } catch (err) {
      return {
        message: 'Error while creating Gnosis Transaction',
        error: `${err}`,
      }
    }
  }

  /**
   * Function that returns all pending transactions
   * @param safeAddress string - The address of the Gnosis Safe
   * @returns SafeTransactions - The response from the Gnosis Safe
   */
  getPendingTransactions = async (
    safeAddress: string
  ): Promise<SafeTransactions | ErrorResponse> => {
    try {
      const res = await axios.get(
        `https://safe-transaction.rinkeby.gnosis.io/api/v1/safes/${safeAddress}/multisig-transactions/?executed=false`
      )

      return res.data
    } catch (err) {
      return {
        message: 'Error while fetching pending transactions',
        error: `${err}`,
      }
    }
  }

  /**
   * Function to return all safe transactions executed
   * @param safeAddress string - The address of the Gnosis Safe
   * @returns SafeTransactions - The response from the Gnosis Safe
   */
  getExecutedTransactions = async (
    safeAddress: string
  ): Promise<SafeTransactions | ErrorResponse> => {
    try {
      const res = await axios.get(
        `https://safe-transaction.rinkeby.gnosis.io/api/v1/safes/${safeAddress}/multisig-transactions/?executed=true`
      )

      return res.data
    } catch (err) {
      return {
        message: 'Error while fetching pending transactions',
        error: `${err}`,
      }
    }
  }

  /**
   * Function to return Details for single transaction
   * @param safeTxHash string - The hash of the transaction
   * @returns MultiSigTransactionResponse - The response from the Gnosis Safe
   */
  getTransactionDetails = async (
    safeTxHash: string
  ): Promise<MultisigTransactionResponse | ErrorResponse> => {
    try {
      const res = await axios.get(
        `https://safe-transaction.rinkeby.gnosis.io/api/v1/multisig-transactions/${safeTxHash}/
        `
      )

      return res.data
    } catch (err) {
      return {
        message: 'Error while fetching pending transactions',
        error: `${err}`,
      }
    }
  }
}
