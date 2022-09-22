import { ethers } from 'ethers'
import { Provider, Web3Provider } from '@ethersproject/providers'
import Safe, {
  EthSignSignature,
  SafeTransactionOptionalProps,
} from '@gnosis.pm/safe-core-sdk'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import axios from 'axios'
import { Networks } from '../utils/networks'
import {
  MetaTransactionData,
  SafeSignature,
  SafeTransactionData,
  SafeTransactionDataPartial,
} from '@gnosis.pm/safe-core-sdk-types'
import SafeServiceClient, {
  SafeBalanceUsdResponse,
  SafeInfoResponse,
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse,
  SignatureResponse,
} from '@gnosis.pm/safe-service-client'
import {
  ErrorResponse,
  SafeExecutionStatus,
  SafeTransactionResponse,
  SafeTransactions,
  UserSafe,
} from '../utils/types'
import { encodeData } from '../lib/helpers'

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
    receiverAddresses: string[],
    tokenAddress?: string
  ): MetaTransactionData[] => {
    const transactions: MetaTransactionData[] = []

    const receiverValue: number = parseInt(value) / receiverAddresses.length

    if (tokenAddress) {
      receiverAddresses.map((receiverAddress) => {
        const encodedData = encodeData(
          ethers.utils.getAddress(receiverAddress),
          receiverValue.toString()
        )

        transactions.push({
          to: ethers.utils.getAddress(tokenAddress),
          value: '0',
          data: encodedData,
          operation: 0,
        })
      })
    } else {
      receiverAddresses.map((receiverAddress) => {
        transactions.push({
          to: receiverAddress,
          value: receiverValue.toString(),
          data: '0x',
          operation: 0,
        })
      })
    }

    return transactions
  }

  createSingleGnosisTx = async (
    receiverAddress: string,
    value: string,
    safeAddress: string,
    senderAddress: string,
    tokenAddress?: string
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

        let encodedCallData = '0x'

        if (tokenAddress) {
          encodedCallData = encodeData(
            ethers.utils.getAddress(receiverAddress),
            value
          )
        }

        const to = tokenAddress ? tokenAddress : receiverAddress

        const tokenValue = tokenAddress ? '0' : value

        const transaction: SafeTransactionDataPartial = {
          to: ethers.utils.getAddress(to),
          data: encodedCallData,
          value: tokenValue,
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
    senderAddress: string,
    tokenAddress?: string
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
          this.generateBatchTransaction(value, receiverAddresses, tokenAddress)

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

  isTransactionOwner = async (
    safeAddress: string
  ): Promise<boolean | ErrorResponse> => {
    try {
      if (this.provider) {
        let isOwner = false
        const safeOwner = await this.provider.getSigner(0)
        const userAddress = await safeOwner.getAddress()
        this.etherAdapter = new EthersAdapter({
          ethers: ethers,
          signer: safeOwner,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: this.txServiceUrl,
          ethAdapter: this.etherAdapter,
        })

        const safeInfo: SafeInfoResponse = await safeService.getSafeInfo(
          safeAddress
        )

        safeInfo.owners.find((owner) => {
          if (owner === userAddress) {
            isOwner = true
          } else {
            isOwner = false
          }
        })

        return isOwner
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

  isTransactionExecutable = async (
    safeTxHash: string,
    safeAddress: string
  ): Promise<SafeExecutionStatus | ErrorResponse> => {
    try {
      if (this.provider) {
        let isOwner = false
        let isExecutable = false
        let isConfirmation = false
        const safeOwner = await this.provider.getSigner(0)
        const userAddress = await safeOwner.getAddress()
        this.etherAdapter = new EthersAdapter({
          ethers: ethers,
          signer: safeOwner,
        })

        const safeService = new SafeServiceClient({
          txServiceUrl: this.txServiceUrl,
          ethAdapter: this.etherAdapter,
        })

        const transaction: SafeMultisigTransactionResponse =
          await safeService.getTransaction(safeTxHash)

        const safeInfo: SafeInfoResponse = await safeService.getSafeInfo(
          safeAddress
        )

        const isSafeOwner = safeInfo.owners.find(
          (owner) => owner === ethers.utils.getAddress(userAddress)
        )

        if (isSafeOwner) {
          isOwner = true
        } else {
          isOwner = false
        }

        if (isOwner) {
          const confirmation = transaction.confirmations!.find(
            (confirmation) =>
              confirmation.owner === ethers.utils.getAddress(userAddress)
          )
          if (confirmation) {
            isConfirmation = false
          } else {
            isConfirmation = true
          }
          if (transaction.confirmations) {
            if (transaction.confirmations.length >= safeInfo.threshold) {
              isExecutable = true
            } else {
              isExecutable = false
            }
          }

          return {
            isOwner,
            isConfirmation,
            isExecutable,
          }
        } else {
          return {
            isOwner,
          }
        }
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

  confirmTransaction = async (
    safeTxHash: string,
    safeAddress: string
  ): Promise<SignatureResponse | ErrorResponse> => {
    try {
      if (this.provider) {
        this.safeAddress = ethers.utils.getAddress(safeAddress)

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

        const signature: SafeSignature = await safeSDK.signTransactionHash(
          safeTxHash
        )
        const result: SignatureResponse = await safeService.confirmTransaction(
          safeTxHash,
          signature.data
        )

        return result
      } else {
        return {
          message: 'Something went wrong while confirming transaction',
          error: 'Provider is null',
        }
      }
    } catch (err) {
      return {
        message: 'Something went wrong while confirming transaction',
        error: `${err}`,
      }
    }
  }

  executeTransaction = async (
    safeTxHash: string,
    safeAddress: string
  ): Promise<any> => {
    try {
      if (this.provider) {
        this.safeAddress = ethers.utils.getAddress(safeAddress)

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

        const transaction: SafeMultisigTransactionResponse =
          await safeService.getTransaction(safeTxHash)

        const safeTransactionData: SafeTransactionData = {
          to: transaction.to,
          value: transaction.value,
          data: transaction.data || '0x',
          operation: transaction.operation,
          safeTxGas: transaction.safeTxGas,
          baseGas: transaction.baseGas,
          gasPrice: parseInt(transaction.gasPrice),
          gasToken: transaction.gasToken,
          refundReceiver: transaction.refundReceiver!,
          nonce: transaction.nonce,
        }

        const safeTransaction = await safeSDK.createTransaction(
          safeTransactionData
        )

        transaction.confirmations!.forEach((confirmation) => {
          const signature = new EthSignSignature(
            confirmation.owner,
            confirmation.signature
          )
          safeTransaction.addSignature(signature)
        })

        const executeTxResponse = await safeSDK.executeTransaction(
          safeTransaction
        )

        const receipt =
          executeTxResponse.transactionResponse &&
          (await executeTxResponse.transactionResponse.wait())

        return receipt
      } else {
        return {
          message: 'Something went wrong while executing transaction',
          error: 'Provider is null',
        }
      }
    } catch (err) {
      return {
        message: 'Something went wrong while executing transaction',
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

  getSafeBalance = async (
    safeAddress: string
  ): Promise<SafeBalanceUsdResponse[] | ErrorResponse> => {
    try {
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/balances/usd/?trusted=false&exclude_spam=false`
      )
      const balance: SafeBalanceUsdResponse[] = result.data
      return balance
    } catch (err) {
      return {
        message: 'Error while fetching Safes Balances',
        error: `${err}`,
      }
    }
  }

  verifySafe = async (safeAddress: string): Promise<boolean> => {
    try {
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/`
      )
      if (result.status === 200) {
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  }
}
