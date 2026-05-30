import { ethers, BrowserProvider } from 'ethers'
import Safe, {
  EthSafeSignature,
  SafeTransactionOptionalProps,
} from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import axios from 'axios'
import { Networks } from '../utils/networks'
import {
  MetaTransactionData,
  SafeMultisigTransactionResponse,
  SafeSignature,
  SafeInfoResponse,
  SafeMultisigTransactionListResponse,
  SignatureResponse,
  SafeBalanceUsdResponse,
  CustomERC20Token,
  SafeExecutionStatus,
  SafeTransactionResponse,
  SafeTransactions,
  TransactionDetails,
  UserSafe,
  SafeBalanceUsdResponsePortal,
} from '../utils/types'
import { encodeData, getDecimalsForToken } from '../lib/helpers'

export class Gnosis {
  private safeAddress = ''
  private provider: BrowserProvider | null = null
  private chainId: number

  private txServiceUrl = ''

  //Constructor

  constructor(provider: BrowserProvider, chainId: number) {
    this.provider = provider
    this.chainId = chainId
    Networks.forEach((network) => {
      if (network.chainId === chainId) {
        this.txServiceUrl = network.url
      }
    })
  }

  /**
   * Adapts the ethers v6 BrowserProvider into the EIP-1193 provider that the
   * Safe protocol-kit v7 `Safe.init` expects.
   */
  private buildEip1193 = () => ({
    request: (args: { method: string; params?: any }) =>
      this.provider!.send(args.method, args.params ?? []),
  })

  private getApiKit = (): SafeApiKit =>
    new SafeApiKit({
      chainId: BigInt(this.chainId),
      txServiceUrl: this.txServiceUrl,
    })

  private getProtocolKit = async (safeAddress: string): Promise<Safe> => {
    const signer = await this.provider!.getSigner()
    const signerAddress = await signer.getAddress()
    return Safe.init({
      provider: this.buildEip1193(),
      signer: signerAddress,
      safeAddress,
    })
  }

  private generateCustomERC20Transaction = (
    receiverAddress: string,
    customERC20Token: CustomERC20Token[]
  ): MetaTransactionData[] => {
    const transactions: MetaTransactionData[] = []

    customERC20Token.map((token) => {
      if (token.tokenAddress) {
        const encodedData = encodeData(
          ethers.getAddress(receiverAddress),
          token.value
        )

        transactions.push({
          to: ethers.getAddress(token.tokenAddress),
          value: '0',
          data: encodedData,
          operation: 0,
        })
      } else {
        transactions.push({
          to: receiverAddress,
          value: token.value,
          data: '0x',
          operation: 0,
        })
      }
    })

    return transactions
  }

  createSingleGnosisTx = async (
    receiverAddress: string,
    value: string,
    safeAddress: string,
    senderAddress: string,
    tokenAddress?: string
  ): Promise<SafeTransactionResponse> => {
    try {
      this.safeAddress = ethers.getAddress(safeAddress)

      if (this.provider) {
        let finalValue = value
        const safeService = this.getApiKit()
        const safeSDK = await this.getProtocolKit(this.safeAddress)

        const nonce = await safeService.getNextNonce(this.safeAddress)

        let encodedCallData = '0x'

        if (tokenAddress) {
          const decimals = await getDecimalsForToken(this.chainId, tokenAddress)
          finalValue = ethers.parseUnits(value, decimals!).toString()
        } else {
          finalValue = ethers.parseEther(value).toString()
        }

        if (tokenAddress) {
          encodedCallData = encodeData(
            ethers.getAddress(receiverAddress),
            finalValue
          )
        }

        const to = tokenAddress ? tokenAddress : receiverAddress

        const tokenValue = tokenAddress ? '0' : finalValue

        const txData: MetaTransactionData = {
          to: ethers.getAddress(to),
          data: encodedCallData,
          value: tokenValue,
          operation: 0,
        }

        const safeTransaction = await safeSDK.createTransaction({
          transactions: [txData],
          options: { nonce: Number(nonce) },
        })

        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

        const senderSignature = await safeSDK.signHash(safeTxHash)

        await safeService.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: ethers.getAddress(senderAddress),
          senderSignature: senderSignature.data,
          origin: 'Samudai Platform',
        })

        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: undefined,
        }

        return data
      } else {
        throw new Error('Provider not found')
      }
    } catch (err: any) {
      throw err
    }
  }

  createBatchTx = async (
    transactions: MetaTransactionData[],
    safeAddress: string,
    senderAddress: string
  ): Promise<SafeTransactionResponse> => {
    try {
      this.safeAddress = ethers.getAddress(safeAddress)

      if (this.provider) {
        const safeService = this.getApiKit()
        const safeSDK = await this.getProtocolKit(this.safeAddress)

        const nonce = await safeService.getNextNonce(this.safeAddress)

        const options: SafeTransactionOptionalProps = {
          nonce: Number(nonce),
        }
        const safeTransactionData: MetaTransactionData[] = []
        await Promise.all(
          transactions.map(async (tx: any) => {
            if (tx?.tokenAddress === '') {
              safeTransactionData.push({
                to: ethers.getAddress(tx.to),
                data: '0x',
                value: ethers.parseEther(tx.value).toString(),
              })
            } else {
              const decimals = await getDecimalsForToken(
                this.chainId,
                tx?.tokenAddress
              )
              const val = ethers.parseUnits(tx.value, decimals!).toString()
              const encodedCallData = encodeData(ethers.getAddress(tx.to), val)
              safeTransactionData.push({
                to: ethers.getAddress(tx?.tokenAddress),
                data: encodedCallData,
                value: '0',
              })
            }
          })
        )
        const safeTransaction = await safeSDK.createTransaction({
          transactions: safeTransactionData,
          onlyCalls: true,
          options,
        })

        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

        const senderSignature = await safeSDK.signHash(safeTxHash)

        await safeService.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: ethers.getAddress(senderAddress),
          senderSignature: senderSignature.data,
          origin: 'Samudai Platform',
        })

        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: undefined,
        }

        return data
      } else {
        throw new Error('Provider not found')
      }
    } catch (error: any) {
      throw error
    }
  }

  getPendingTransactions = async (
    safeAddress: string
  ): Promise<SafeMultisigTransactionListResponse> => {
    try {
      if (this.provider) {
        const safeService = this.getApiKit()

        const pendingTxs: SafeMultisigTransactionListResponse =
          await safeService.getPendingTransactions(
            ethers.getAddress(safeAddress)
          )

        return pendingTxs
      } else {
        throw new Error('Provider not found')
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * Function to return all safe transactions executed
   * @param safeAddress string - The address of the Gnosis Safe
   * @returns SafeTransactions - The response from the Gnosis Safe
   */
  getExecutedTransactions = async (
    safeAddress: string
  ): Promise<SafeTransactions> => {
    try {
      const res = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/?executed=true`
      )

      return res.data
    } catch (err) {
      throw err
    }
  }

  getRecentTransactions = async (safeAddress: string) => {
    try {
      const res = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/all-transactions/?limit=40&executed=false&queued=true&trusted=true`
      )

      return res.data
    } catch (err) {
      throw err
    }
  }

  getTransactionDetails = async (
    safeTxHash: string
  ): Promise<TransactionDetails> => {
    try {
      if (this.provider) {
        const safeService = this.getApiKit()

        const tx: SafeMultisigTransactionResponse =
          await safeService.getTransaction(safeTxHash)

        const safeOwners = await safeService.getSafeInfo(this.safeAddress)

        const data: TransactionDetails = {
          safeMultisigTransactionResponse: tx,
          confirmation: safeOwners.threshold,
        }

        return data
      } else {
        throw new Error('Provider not found')
      }
    } catch (err) {
      throw err
    }
  }

  isTransactionOwner = async (safeAddress: string): Promise<boolean> => {
    try {
      if (this.provider) {
        let isOwner = false
        const safeOwner = await this.provider.getSigner()
        const userAddress = await safeOwner.getAddress()
        const safeService = this.getApiKit()

        const safeInfo: SafeInfoResponse =
          await safeService.getSafeInfo(safeAddress)

        safeInfo.owners.find((owner) => {
          if (owner === userAddress) {
            isOwner = true
          } else {
            isOwner = false
          }
        })

        return isOwner
      } else {
        throw new Error('Provider not found')
      }
    } catch (err) {
      throw err
    }
  }

  isTransactionExecutable = async (
    safeTxHash: string,
    safeAddress: string
  ): Promise<SafeExecutionStatus> => {
    try {
      if (this.provider) {
        let isOwner = false
        let isExecutable = false
        let isConfirmation = false
        const safeOwner = await this.provider.getSigner()
        const userAddress = await safeOwner.getAddress()
        const safeService = this.getApiKit()

        const transaction: SafeMultisigTransactionResponse =
          await safeService.getTransaction(safeTxHash)

        const safeInfo: SafeInfoResponse =
          await safeService.getSafeInfo(safeAddress)

        const isSafeOwner = safeInfo.owners.find(
          (owner) => owner === ethers.getAddress(userAddress)
        )

        if (isSafeOwner) {
          isOwner = true
        } else {
          isOwner = false
        }

        if (isOwner) {
          const confirmation = transaction.confirmations!.find(
            (confirmation) =>
              confirmation.owner === ethers.getAddress(userAddress)
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
        throw new Error('Provider not found')
      }
    } catch (err) {
      throw err
    }
  }

  confirmTransaction = async (
    safeTxHash: string,
    safeAddress: string
  ): Promise<SignatureResponse> => {
    try {
      if (this.provider) {
        this.safeAddress = ethers.getAddress(safeAddress)

        const safeService = this.getApiKit()
        const safeSDK = await this.getProtocolKit(this.safeAddress)

        const signature: SafeSignature = await safeSDK.signHash(safeTxHash)
        const result: SignatureResponse = await safeService.confirmTransaction(
          safeTxHash,
          signature.data
        )

        return result
      } else {
        throw new Error('Provider not found')
      }
    } catch (err) {
      throw err
    }
  }
  rejectTransaction = async (
    safeAddress: string,
    nonce: number,
    senderAddress: string
  ): Promise<SafeTransactionResponse> => {
    try {
      if (this.provider) {
        this.safeAddress = ethers.getAddress(safeAddress)
        const safeService = this.getApiKit()
        const safeSDK = await this.getProtocolKit(this.safeAddress)

        const safeTransaction = await safeSDK.createRejectionTransaction(nonce)
        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

        const senderSignature = await safeSDK.signHash(safeTxHash)

        await safeService.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: ethers.getAddress(senderAddress),
          senderSignature: senderSignature.data,
          origin: 'Samudai Platform',
        })
        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: undefined,
        }

        return data
      } else {
        throw new Error('Provider not found')
      }
    } catch (error) {
      throw error
    }
  }
  executeTransaction = async (
    safeTxHash: string,
    safeAddress: string
  ): Promise<any> => {
    try {
      if (this.provider) {
        this.safeAddress = ethers.getAddress(safeAddress)

        const safeService = this.getApiKit()
        const safeSDK = await this.getProtocolKit(this.safeAddress)

        const transaction: SafeMultisigTransactionResponse =
          await safeService.getTransaction(safeTxHash)

        const txData: MetaTransactionData = {
          to: transaction.to,
          value: transaction.value,
          data: transaction.data || '0x',
          operation: transaction.operation,
        }

        const options: SafeTransactionOptionalProps = {
          safeTxGas: transaction.safeTxGas.toString(),
          baseGas: transaction.baseGas.toString(),
          gasPrice: parseInt(transaction.gasPrice).toString(),
          gasToken: transaction.gasToken,
          refundReceiver: transaction.refundReceiver!,
          nonce: Number(transaction.nonce),
        }

        const safeTransaction = await safeSDK.createTransaction({
          transactions: [txData],
          options,
        })

        transaction.confirmations!.forEach((confirmation) => {
          const signature = new EthSafeSignature(
            confirmation.owner,
            confirmation.signature
          )
          safeTransaction.addSignature(signature)
        })

        const executeTxResponse =
          await safeSDK.executeTransaction(safeTransaction)

        const receipt =
          executeTxResponse.transactionResponse &&
          (await (executeTxResponse.transactionResponse as any).wait())

        return receipt
      } else {
        throw new Error('Provider not found')
      }
    } catch (err) {
      throw err
    }
  }

  getSafeOwners = async (safeAddress: string): Promise<string[] | null> => {
    try {
      const owners: string[] = []
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/`
      )
      const safeOwners = result.data.owners

      for (const owner of safeOwners) {
        //const address = (await this.provider?.lookupAddress(owner)) || owner
        owners.push(owner)
      }

      return owners
    } catch (err) {
      return null
    }
  }

  connectGnosis = async (userAddress: string): Promise<UserSafe[]> => {
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
      throw err
    }
  }

  // Reminder to change the api url before pushing to dev
  getSafeBalance = async (
    safeAddress: string
  ): Promise<SafeBalanceUsdResponse[]> => {
    try {
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${safeAddress}/balances/usd/?trusted=false&exclude_spam=false`
        // `https://safe-transaction-goerli.safe.global/api/v1/safes/0x6744fC3A5A9CAAeC22c939Bb0737679b768C5e4c/balances/usd/?trusted=false&exclude_spam=false`
      )
      const balance: SafeBalanceUsdResponse[] = result.data
      return balance
    } catch (err) {
      throw err
    }
  }
  // Reminder to change the api url before pushing to dev

  getSafeBalanceinUSD = async (
    safeAddress: string
  ): Promise<SafeBalanceUsdResponsePortal[]> => {
    try {
      const result = await axios.get(
        `https://api.portals.fi/v2/account?owner=${safeAddress}&networks=ethereum`
      )
      const balance: SafeBalanceUsdResponsePortal[] = result.data
      return balance
    } catch (err) {
      throw err
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
      throw err
    }
  }

  customERC20Transfer = async (
    safeAddress: string,
    receiverAddress: string,
    senderAddress: string,
    customERC20Token: CustomERC20Token[]
  ): Promise<SafeTransactionResponse> => {
    try {
      this.safeAddress = ethers.getAddress(safeAddress)

      if (this.provider) {
        const safeService = this.getApiKit()
        const safeSDK = await this.getProtocolKit(this.safeAddress)

        const nonce = await safeService.getNextNonce(this.safeAddress)

        const safeTransactionData: MetaTransactionData[] =
          this.generateCustomERC20Transaction(receiverAddress, customERC20Token)

        const options: SafeTransactionOptionalProps = {
          nonce: Number(nonce), // Optional
        }

        const safeTransaction = await safeSDK.createTransaction({
          transactions: safeTransactionData,
          options,
        })

        const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

        const senderSignature = await safeSDK.signHash(safeTxHash)

        await safeService.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: ethers.getAddress(senderAddress),
          senderSignature: senderSignature.data,
          origin: 'Samudai Platform',
        })

        const data: SafeTransactionResponse = {
          safeTxHash: safeTxHash,
          proposedSafeTx: undefined,
        }

        return data
      } else {
        throw new Error('Provider not found')
      }
    } catch (err: any) {
      throw err
    }
  }
}
