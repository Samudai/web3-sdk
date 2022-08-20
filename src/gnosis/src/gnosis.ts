import { ethers } from 'ethers'
import { Provider, Web3Provider } from '@ethersproject/providers'
import Safe, { SafeTransactionOptionalProps } from '@gnosis.pm/safe-core-sdk'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import axios from 'axios'
import { Networks } from '../utils/networks'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
} from '@gnosis.pm/safe-core-sdk-types'
import SafeServiceClient, {
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse,
} from '@gnosis.pm/safe-service-client'
import {
  ErrorResponse,
  SafeTransactionResponse,
  SafeTransactions,
  UserSafe,
} from '../utils/types'

export class Gnosis {
  private safeAddress = ''
  private provider: Web3Provider | null = null
  private chainId: number
  private etherAdapter: EthersAdapter | null = null

  private txServiceUrl = ''

  //Constructor

  constructor(provider: Web3Provider, chainId: number) {
    this.provider = provider
    this.chainId = chainId
    Networks.forEach((network) => {
      if (network.chainId === chainId) {
        this.txServiceUrl = network.url
      }
    })
  }

  private generateBatchTransaction = (
    value: string,
    receiverAddresses: string[]
  ): MetaTransactionData[] => {
    const transactions: MetaTransactionData[] = []

    const receiverValue: number = parseInt(value) / receiverAddresses.length

    receiverAddresses.map((receiverAddress) => {
      transactions.push({
        to: receiverAddress,
        value: receiverValue.toString(),
        data: '0x',
        operation: 0,
      })
    })

    return transactions
  }

  createSingleGnosisTx = async (
    receiverAddress: string,
    value: string,
    safeAddress: string,
    senderAddress: string
  ): Promise<SafeTransactionResponse | ErrorResponse> => {
    try {
      this.safeAddress = ethers.utils.getAddress(safeAddress)

      if (this.provider) {
        const safeOwner = await this.provider.getSigner(0)

        this.etherAdapter = new EthersAdapter({
          ethers: ethers,
          signer: safeOwner,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: this.txServiceUrl,
          ethAdapter: this.etherAdapter,
        })

        const safeSDK = await Safe.create({
          ethAdapter: this.etherAdapter,
          safeAddress: this.safeAddress,
        })

        const nonce = await safeService.getNextNonce(this.safeAddress)

        const transaction: SafeTransactionDataPartial = {
          to: ethers.utils.getAddress(receiverAddress),
          data: '0x',
          value: value,
          operation: 0,
          nonce: nonce,
        }

        const safeTransaction = await safeSDK.createTransaction(transaction)

        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

        const senderSignature = await safeSDK.signTransactionHash(safeTxHash)

        const result = await safeService.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: ethers.utils.getAddress(senderAddress),
          senderSignature: senderSignature.data,
          origin: 'Samudai Platform',
        })

        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: result,
        }

        return data
      } else {
        return {
          message: 'Something went wrong while creating Gnosis Transaction',
          error: 'Provider is null',
        }
      }
    } catch (err: any) {
      return {
        message: 'Error while creating Gnosis Transaction',
        error: `${err}`,
      }
    }
  }

  createBatchGnosisTx = async (
    safeAddress: string,
    receiverAddresses: string[],
    value: string,
    senderAddress: string
  ): Promise<SafeTransactionResponse | ErrorResponse> => {
    try {
      this.safeAddress = ethers.utils.getAddress(safeAddress)

      if (this.provider) {
        const safeOwner = await this.provider.getSigner(0)

        this.etherAdapter = new EthersAdapter({
          ethers: ethers,
          signer: safeOwner,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: this.txServiceUrl,
          ethAdapter: this.etherAdapter,
        })

        const safeSDK = await Safe.create({
          ethAdapter: this.etherAdapter,
          safeAddress: this.safeAddress,
        })

        const nonce = await safeService.getNextNonce(this.safeAddress)

        const transactions: MetaTransactionData[] =
          this.generateBatchTransaction(value, receiverAddresses)

        const options: SafeTransactionOptionalProps = {
          nonce, // Optional
        }

        const safeTransaction = await safeSDK.createTransaction(
          transactions,
          options
        )

        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

        const senderSignature = await safeSDK.signTransactionHash(safeTxHash)

        const result = await safeService.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: ethers.utils.getAddress(senderAddress),
          senderSignature: senderSignature.data,
          origin: 'Samudai Platform',
        })

        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: result,
        }

        return data
      } else {
        return {
          message: 'Something went wrong while creating Gnosis Transaction',
          error: 'Provider is null',
        }
      }
    } catch (err: any) {
      return {
        message: 'Error while creating Gnosis Transaction',
        error: `${err}`,
      }
    }
  }

  getPendingTransactions = async (
    safeAddress: string
  ): Promise<SafeMultisigTransactionListResponse | ErrorResponse> => {
    try {
      if (this.provider) {
        const safeOwner = await this.provider.getSigner(0)

        this.etherAdapter = new EthersAdapter({
          ethers: ethers,
          signer: safeOwner,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: this.txServiceUrl,
          ethAdapter: this.etherAdapter,
        })

        const pendingTxs: SafeMultisigTransactionListResponse =
          await safeService.getPendingTransactions(
            ethers.utils.getAddress(safeAddress)
          )

        return pendingTxs
      } else {
        return {
          message: 'Something went wrong while getting pending transactions',
          error: 'Provider is null',
        }
      }
    } catch (err) {
      return {
        message: 'Something went wrong while getting pending transactions',
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
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/?executed=true`
      )

      return res.data
    } catch (err) {
      return {
        message: 'Error while fetching pending transactions',
        error: `${err}`,
      }
    }
  }

  getTransactionDetails = async (
    safeTxHash: string
  ): Promise<SafeMultisigTransactionResponse | ErrorResponse> => {
    try {
      if (this.provider) {
        const safeOwner = await this.provider.getSigner(0)

        this.etherAdapter = new EthersAdapter({
          ethers: ethers,
          signer: safeOwner,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: this.txServiceUrl,
          ethAdapter: this.etherAdapter,
        })

        const tx: SafeMultisigTransactionResponse =
          await safeService.getTransaction(safeTxHash)

        return tx
      } else {
        return {
          message: 'Something went wrong while getting transaction info',
          error: 'Provider is null',
        }
      }
    } catch (err) {
      return {
        message: 'Something went wrong while getting transaction info',
        error: `${err}`,
      }
    }
  }

  getSafeOwners = async (safeAddress: string): Promise<string[] | null> => {
    try {
      const owners: string[] = []
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/`
      )
      const safeOwners = result.data.owners

      for (const owner of owners) {
        const address = (await this.provider?.lookupAddress(owner)) || owner
        owners.push(address)
      }

      return owners
    } catch (err) {
      return null
    }
  }

  connectGnosis = async (
    userAddress: string
  ): Promise<UserSafe[] | ErrorResponse> => {
    try {
      const UserSafes: UserSafe[] = []
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/owners/${userAddress}/safes/`
      )
      const userSafes: string[] = result.data.safes
      for (const userSafe of userSafes) {
        const owners = await this.getSafeOwners(userSafe)
        UserSafes.push({
          safeAddress: userSafe,
          owners: owners,
        })
      }

      return UserSafes
    } catch (err) {
      return {
        message: 'Error while fetching Safes For user',
        error: `${err}`,
      }
    }
  }
}
