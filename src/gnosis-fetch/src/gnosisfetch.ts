import { Networks } from '../../gnosis/utils/networks'
import { BigNumber, ethers } from 'ethers'
import {
  ErrorResponse,
  SafeTransactions,
  TransactionDetails,
  TxObject,
  TxHistoryObject,
  TxHistoryDetails,
  SafeBalanceUsdResponsePortal,
  TxDetails,
  TransactionType,
  TransactionNature,
  WidgetBalance,
} from '../../gnosis/utils/types'
import axios from 'axios'
import {
  SafeMultisigTransactionResponse,
  SafeBalanceUsdResponse,
  SafeMultisigTransactionListResponse,
} from '@gnosis.pm/safe-service-client'
export class GnosisFetch {
  private safeAddress = ''
  private chainId: number
  private txServiceUrl = ''

  constructor(safeAddress: string, chainId: number) {
    this.safeAddress = safeAddress
    this.chainId = chainId
    Networks.forEach((network) => {
      if (network.chainId === chainId) {
        this.txServiceUrl = network.url
      }
    })
  }

  getExecutedTransactions = async (): Promise<SafeTransactions> => {
    try {
      if (this.safeAddress !== '') {
        const res = await axios.get(
          `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/multisig-transactions/?executed=true`
        )

        return res.data
      } else {
        throw new Error('Safe address not provided')
      }
    } catch (err) {
      throw err
    }
  }

  getRecentTransactions = async () => {
    try {
      if (this.safeAddress !== '') {
        const res = await axios.get(
          `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/all-transactions/?limit=20&executed=false&queued=true&trusted=true`
        )

        return res.data
      } else {
        throw new Error('Safe address not provided')
      }
    } catch (err) {
      throw err
    }
  }

  getTransactionDetails = async (
    txHash: string
  ): Promise<TransactionDetails> => {
    try {
      if (this.safeAddress !== '') {
        const res = await axios.get(
          `${this.txServiceUrl}/api/v1/multisig-transactions/${txHash}`
        )

        const safeInfo = await axios.get(
          `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}`
        )

        //const safeData = safeInfo.data

        const confirmations: number = safeInfo.data.threshold

        const data: TransactionDetails = {
          confirmation: confirmations,
          safeMultisigTransactionResponse: res.data,
        }

        return data
      } else {
        throw new Error('Safe address not provided')
      }
    } catch (err) {
      throw err
    }
  }

  getSafeOwners = async (): Promise<string[] | null> => {
    try {
      const owners: string[] = []
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/`
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

  getOwnersNeedToBeNudged = async (
    reactedOwners: string[]
  ): Promise<string[] | null> => {
    try {
      const owners: string[] = []
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/`
      )
      const safeOwners = result.data.owners
      for (const owner of safeOwners) {
        owners.push(owner)
      }

      let ownersNeedToBeNudged: string[]
      ownersNeedToBeNudged = owners.filter(
        (owner) => !reactedOwners.includes(owner)
      )
      return ownersNeedToBeNudged
    } catch (error) {
      return null
    }
  }
  // change them to this.safeadress
  getSafeBalance = async (): Promise<SafeBalanceUsdResponse[]> => {
    try {
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/balances/usd/?trusted=false&exclude_spam=false`
        // `https://safe-transaction-goerli.safe.global/api/v1/safes/0x6744fC3A5A9CAAeC22c939Bb0737679b768C5e4c/balances/usd/?trusted=false&exclude_spam=false`
      )
      const balance: SafeBalanceUsdResponse[] = result.data
      return balance
    } catch (err) {
      throw err
    }
  }
  getSafeBalanceinUSD = async (): Promise<SafeBalanceUsdResponsePortal[]> => {
    try {
      const result = await axios.get(
        `https://api.portals.fi/v2/account?owner=${this.safeAddress}&networks=ethereum`,
        {
          headers: {
            Authorization: 'Bearer 8c182698-36a3-4e89-8fb7-bb476148235c',
          },
        }
      )
      const balance: SafeBalanceUsdResponsePortal[] = result.data.balances
      return balance
    } catch (err) {
      throw err
    }
  }
  getWidgetTokenBalance = async () => {
    try {
      const tokenDetails: SafeBalanceUsdResponse[] = await this.getSafeBalance()
      const tokenDetailsUSD: SafeBalanceUsdResponsePortal[] =
        await this.getSafeBalanceinUSD()
      const token_map = new Map()
      if (tokenDetails.length > 0) {
        for (let token = 0; token < tokenDetails.length; token++) {
          const token_item = {
            address: '',
            decimals: 0,
            logoUri: '', //logo url
            name: '',
            symbol: '',
            type: '',
            usd: 0,
            balance: 0,
          }
          if (
            tokenDetails[token].token === null &&
            tokenDetails[token].balance !== null
          ) {
            token_item.address = '0x0000000000000000000000000000000000000000'
            token_item.decimals = 18
            token_item.symbol = 'ETH'
            token_item.name = 'Ethereum'
            token_item.balance = Number(
              ethers.utils.formatUnits(
                BigNumber.from(tokenDetails[token].balance),
                18
              )
            )
            token_map.set(
              '0x0000000000000000000000000000000000000000',
              token_item
            )
          } else if (tokenDetails[token].token !== null) {
            token_item.address = tokenDetails[token].tokenAddress.toLowerCase()
            token_item.decimals = tokenDetails[token].token.decimals
            token_item.symbol = tokenDetails[token].token.symbol
            token_item.name = tokenDetails[token].token.name
            token_item.logoUri = tokenDetails[token].token.logoUri
            token_item.balance = Number(
              ethers.utils.formatUnits(
                BigNumber.from(tokenDetails[token].balance),
                tokenDetails[token].token.decimals
              )
            )
            token_map.set(token_item.address, token_item)
          } else {
            return
          }
        }
        if (tokenDetailsUSD.length > 0) {
          for (let token = 0; token < tokenDetailsUSD.length; token++) {
            const addr = tokenDetailsUSD[token].address
            const token_item = token_map.get(addr)
            token_item.usd = tokenDetailsUSD[token].price
            if (token_item.logoUri === '') {
              token_item.logoUri = tokenDetailsUSD[token].image
            }
            token_map.set(addr, token_item)
          }
        }
        const widget: WidgetBalance[] = []
        token_map.forEach((key: any, value: any) => {
          const widgetItem: WidgetBalance = {
            symbol: '',
            balance: 0,
            usdValue: 0,
          }
          widgetItem.balance = key.balance
          widgetItem.symbol = key.symbol
          widgetItem.usdValue = key.usd
          widget.push(widgetItem)
        })
        return widget
      } else {
        throw new Error('No assets found for the corresponding wallet')
      }
    } catch (error) {
      throw error
    }
  }

  getTokenMap = async () => {
    try {
      const tokenDetails: SafeBalanceUsdResponse[] = await this.getSafeBalance()
      const tokenDetailsUSD: SafeBalanceUsdResponsePortal[] =
        await this.getSafeBalanceinUSD()
      const token_map = new Map()
      if (tokenDetails.length > 0) {
        for (let token = 0; token < tokenDetails.length; token++) {
          const token_item = {
            address: '',
            decimals: 0,
            logoUri: '', //logo url
            name: '',
            symbol: '',
            type: '',
            usd: 0,
          }
          if (
            tokenDetails[token].token === null &&
            tokenDetails[token].balance !== null
          ) {
            token_item.address = '0x0000000000000000000000000000000000000000'
            token_item.decimals = 18
            token_item.symbol = 'ETH'
            token_item.name = 'Ethereum'
            token_map.set(
              '0x0000000000000000000000000000000000000000',
              token_item
            )
          } else if (tokenDetails[token].token !== null) {
            token_item.address = tokenDetails[token].tokenAddress.toLowerCase()
            token_item.decimals = tokenDetails[token].token.decimals
            token_item.symbol = tokenDetails[token].token.symbol
            token_item.name = tokenDetails[token].token.name
            token_item.logoUri = tokenDetails[token].token.logoUri
            token_map.set(token_item.address, token_item)
          } else {
            return
          }
        }
        if (tokenDetailsUSD.length > 0) {
          for (let token = 0; token < tokenDetailsUSD.length; token++) {
            const addr = tokenDetailsUSD[token].address
            const token_item = token_map.get(addr)
            token_item.usd = tokenDetailsUSD[token].price
            if (token_item.logoUri === '') {
              token_item.logoUri = tokenDetailsUSD[token].image
            }
            token_map.set(addr, token_item)
          }
        }
        return token_map
      } else {
        throw new Error('No assets found for the corresponding wallet')
      }
    } catch (error) {
      throw error
    }
  }

  getQueuedPayments = async (): Promise<TxObject[]> => {
    try {
      const res = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/all-transactions/?executed=false&queued=true&trusted=true`
        // `https://safe-transaction-goerli.safe.global/api/v1/safes/0x6744fC3A5A9CAAeC22c939Bb0737679b768C5e4c/all-transactions/?executed=false&queued=true&trusted=true`
      )
      let token_map = await this.getTokenMap()
      let queueTransaction: TxObject[] = []
      let isExecMap = new Map()
      res.data.results.map((item: any) => {
        const transactionDetails: TxDetails[] = []
        const confirmation: string[] = []
        const transaction: TxObject = {
          nonce: 0,
          type: TransactionType.OTHER,
          nature: TransactionNature.OTHER,
          date: '',
          amountUSD: 0,
          transactionDetails: transactionDetails,
          confirmationsRequired: 0,
          confirmations: confirmation,
          safeTxHash: '',
        }
        transaction.safeTxHash = item?.safeTxHash
        transaction.nonce = item?.nonce
        if (!isExecMap.has(item?.nonce)) {
          isExecMap.set(item?.nonce, item?.isExecuted)
        }
        if (isExecMap.get(item?.nonce) === false) {
          if (item?.txType === 'MULTISIG_TRANSACTION') {
            // When you send a single ERC20 token
            transaction.safeTxHash = item?.safeTxHash
            transaction.nonce = item?.nonce
            transaction.date = item?.submissionDate
            // transaction.confirmations = item?.confirmations
            item?.confirmations.map((ownerObject: any) => {
              confirmation.push(ownerObject.owner)
            })
            transaction.confirmations = confirmation
            transaction.confirmationsRequired = item?.confirmationsRequired

            if (item?.data === null && item?.value === '0') {
              transaction.type = TransactionType.REJECTION
            } else if (item?.dataDecoded?.method === 'transfer') {
              let transactionDetailsTemp: TxDetails = {
                walletAddress: '',
                currency: '',
                amount: 0,
                logo: '',
                amountUSD: 0,
              }
              transaction.type = TransactionType.SENT
              transaction.nature = TransactionNature.SINGLE
              transactionDetailsTemp.walletAddress =
                item?.dataDecoded?.parameters?.[0]?.value
              const tokenDetails = token_map?.get(item?.to.toLowerCase())
              transactionDetailsTemp.amount = Number(
                ethers.utils.formatUnits(
                  BigNumber.from(item?.dataDecoded?.parameters?.[1]?.value),
                  tokenDetails?.decimals
                )
              )
              transactionDetailsTemp.amountUSD =
                tokenDetails.usd != undefined ? tokenDetails.usd : 0
              transaction.amountUSD =
                transactionDetailsTemp.amountUSD * transactionDetailsTemp.amount
              transactionDetailsTemp.currency = tokenDetails.symbol
              transactionDetailsTemp.logo = tokenDetails.logoUri
              transaction.transactionDetails.push(transactionDetailsTemp)
            } // single Ether transfer
            else if (item?.data === null && item?.value != null) {
              let transactionDetailsTemp: TxDetails = {
                walletAddress: '',
                currency: '',
                amount: 0,
                logo: '',
                amountUSD: 0,
              }
              transaction.type = TransactionType.SENT
              transaction.nature = TransactionNature.SINGLE
              transactionDetailsTemp.walletAddress = item?.to
              const tokenDetails = token_map?.get(
                '0x0000000000000000000000000000000000000000'
              )
              transactionDetailsTemp.amount = Number(
                ethers.utils.formatUnits(
                  BigNumber.from(item?.value),
                  tokenDetails?.decimals
                )
              )
              transactionDetailsTemp.amountUSD =
                tokenDetails.usd != undefined ? tokenDetails.usd : 0
              transaction.amountUSD =
                transactionDetailsTemp.amountUSD * transactionDetailsTemp.amount
              transactionDetailsTemp.currency = tokenDetails.symbol
              transactionDetailsTemp.logo = tokenDetails.logoUri
              transaction.transactionDetails.push(transactionDetailsTemp)
            } else if (item?.dataDecoded?.method === 'multiSend') {
              transaction.type = TransactionType.SENT
              transaction.nature = TransactionNature.BATCH
              item?.dataDecoded?.parameters[0]?.valueDecoded?.map((tx: any) => {
                // console.log('TXSDK: ', tx)
                if (tx.data === null && tx.value != null) {
                  let transactionDetailsTemp: TxDetails = {
                    walletAddress: '',
                    currency: '',
                    amount: 0,
                    logo: '',
                    amountUSD: 0,
                  }
                  const tokenDetails = token_map?.get(
                    '0x0000000000000000000000000000000000000000'
                  )
                  transactionDetailsTemp.walletAddress = tx.to
                  transactionDetailsTemp.amount = Number(
                    ethers.utils.formatUnits(
                      BigNumber.from(tx.value),
                      tokenDetails?.decimals
                    )
                  )
                  transactionDetailsTemp.logo = tokenDetails.logoUri
                  transactionDetailsTemp.currency = tokenDetails.symbol
                  transactionDetailsTemp.amountUSD =
                    tokenDetails.usd != undefined ? tokenDetails.usd : 0
                  transaction.amountUSD +=
                    transactionDetailsTemp.amountUSD *
                    transactionDetailsTemp.amount
                  transaction.transactionDetails.push(transactionDetailsTemp)
                } else {
                  let transactionDetailsTemp: TxDetails = {
                    walletAddress: '',
                    currency: '',
                    amount: 0,
                    logo: '',
                    amountUSD: 0,
                  }
                  const tokenDetails = token_map?.get(tx.to.toLowerCase())
                  transactionDetailsTemp.walletAddress =
                    tx.dataDecoded?.parameters?.[0]?.value
                  transactionDetailsTemp.amount = Number(
                    ethers.utils.formatUnits(
                      BigNumber.from(tx.dataDecoded?.parameters?.[1]?.value),
                      tokenDetails?.decimals
                    )
                  )
                  transactionDetailsTemp.amountUSD =
                    tokenDetails.usd != undefined ? tokenDetails.usd : 0
                  transactionDetailsTemp.logo = tokenDetails.logoUri
                  transactionDetailsTemp.currency = tokenDetails.symbol
                  transaction.amountUSD +=
                    transactionDetailsTemp.amountUSD *
                    transactionDetailsTemp.amount
                  transaction.transactionDetails.push(transactionDetailsTemp)
                }
              })
            } else {
              transaction.nature = TransactionNature.OTHER
              transaction.type = TransactionType.OTHER
            }
          }
          queueTransaction.push(transaction)
        }
      })
      return queueTransaction
    } catch (err) {
      throw err
    }
  }

  getTransactionHistory = async (): Promise<TxHistoryObject[]> => {
    try {
      const res = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/all-transactions/?executed=true&queued=false&trusted=true`
        // `https://safe-transaction-goerli.safe.global/api/v1/safes/0x6744fC3A5A9CAAeC22c939Bb0737679b768C5e4c/all-transactions/?executed=true&queued=false&trusted=true`
      )
      let token_map = await this.getTokenMap()
      let historyTransaction: TxHistoryObject[] = []
      let txURL = 'https://etherscan.io/tx/'
      res.data.results.map((item: any) => {
        const transactionDetails: TxHistoryDetails[] = []
        const transaction: TxHistoryObject = {
          nonce: -1,
          type: TransactionType.OTHER,
          nature: TransactionNature.OTHER,
          executionDate: '',
          amountUSD: 0,
          transactionDetails: transactionDetails,
          executedBy: '',
          safeTxHash: '',
          txHash: '',
          url: '',
        }
        transaction.executionDate = item?.executionDate
        if (item?.txType === 'ETHEREUM_TRANSACTION') {
          // RECIEVED
          transaction.txHash = item?.txHash
          transaction.type = TransactionType.RECEIVED
          transaction.url = txURL + item?.txHash
          if (item?.transfers?.length > 1) {
            transaction.nature = TransactionNature.BATCH
          } else if (item?.transfers?.length === 1) {
            transaction.nature = TransactionNature.SINGLE
          } else {
            transaction.nature = TransactionNature.OTHER
          }
          if (item?.transfers?.length > 0) {
            item?.transfers.map((tx: any) => {
              let transactionDetailsTemp: TxHistoryDetails = {
                from: '',
                walletAddress: '',
                currency: '',
                amount: 0,
                logo: '',
                amountUSD: 0,
              }
              transactionDetailsTemp.from = item?.from
              transactionDetailsTemp.walletAddress = tx?.to
              if (tx?.type === 'ETHER_TRANSFER') {
                // Recieving ether
                const tokenDetails = token_map?.get(
                  '0x0000000000000000000000000000000000000000'
                )
                transactionDetailsTemp.amount = Number(
                  ethers.utils.formatUnits(
                    BigNumber.from(tx?.value),
                    tokenDetails?.decimals
                  )
                )
                transactionDetailsTemp.amountUSD =
                  tokenDetails.usd != undefined ? tokenDetails.usd : 0
                transaction.amountUSD +=
                  transactionDetailsTemp.amountUSD *
                  transactionDetailsTemp.amount
                transactionDetailsTemp.currency = tokenDetails.symbol
                transactionDetailsTemp.logo = tokenDetails.logoUri
                transaction.transactionDetails.push(transactionDetailsTemp)
              } else if (tx?.type === 'ERC20_TRANSFER') {
                // Recieving other erc20 tokens
                const tokenDetails = token_map?.get(
                  tx?.tokenAddress.toLowerCase()
                )
                transactionDetailsTemp.amount = Number(
                  ethers.utils.formatUnits(
                    BigNumber.from(tx?.value),
                    tokenDetails?.decimals
                  )
                )
                transactionDetailsTemp.amountUSD =
                  tokenDetails.usd != undefined ? tokenDetails.usd : 0
                transaction.amountUSD +=
                  transactionDetailsTemp.amountUSD *
                  transactionDetailsTemp.amount
                transactionDetailsTemp.currency = tokenDetails.symbol
                transactionDetailsTemp.logo = tokenDetails.logoUri
                transaction.transactionDetails.push(transactionDetailsTemp)
              } else {
                transaction.type = TransactionType.OTHER
              }
            })
          }
        } else if (item?.txType === 'MULTISIG_TRANSACTION') {
          // SENT
          transaction.nonce = item?.nonce
          transaction.executionDate = item?.executionDate
          transaction.safeTxHash = item?.safeTxHash
          transaction.txHash = item?.transactionHash
          transaction.url = txURL + item?.transactionHash
          transaction.executedBy = item?.executor
          // single
          if (item?.transfers?.length === 1) {
            transaction.nature = TransactionNature.SINGLE
            transaction.type = TransactionType.SENT
            let transactionDetailsTemp: TxHistoryDetails = {
              from: '',
              walletAddress: '',
              currency: '',
              amount: 0,
              logo: '',
              amountUSD: 0,
            }
            if (item?.transfers[0].type === 'ETHER_TRANSFER') {
              const tokenDetails = token_map?.get(
                '0x0000000000000000000000000000000000000000'
              )
              transactionDetailsTemp.walletAddress = item?.transfers[0].to
              transactionDetailsTemp.amount = Number(
                ethers.utils.formatUnits(
                  BigNumber.from(item?.transfers[0].value),
                  tokenDetails?.decimals
                )
              )
              transactionDetailsTemp.amountUSD =
                tokenDetails.usd != undefined ? tokenDetails.usd : 0
              transaction.amountUSD =
                transactionDetailsTemp.amountUSD * transactionDetailsTemp.amount
              transactionDetailsTemp.currency = tokenDetails.symbol
              transactionDetailsTemp.logo = tokenDetails.logoUri
              transaction.transactionDetails.push(transactionDetailsTemp)
            } else if (item?.transfers[0].type === 'ERC20_TRANSFER') {
              const tokenDetails = token_map?.get(
                item?.transfers[0].tokenAddress.toLowerCase()
              )
              transactionDetailsTemp.walletAddress = item?.transfers[0].to
              transactionDetailsTemp.amount = Number(
                ethers.utils.formatUnits(
                  BigNumber.from(item?.transfers[0].value),
                  tokenDetails?.decimals
                )
              )
              transactionDetailsTemp.amountUSD =
                tokenDetails.usd != undefined ? tokenDetails.usd : 0
              transaction.amountUSD =
                transactionDetailsTemp.amountUSD * transactionDetailsTemp.amount
              transactionDetailsTemp.currency = tokenDetails.symbol
              transactionDetailsTemp.logo = tokenDetails.logoUri
              transaction.transactionDetails.push(transactionDetailsTemp)
            } else {
              transaction.type = TransactionType.OTHER
            }
          } else if (
            item?.transfers?.length > 1 &&
            item?.dataDecoded?.method === 'multiSend'
          ) {
            transaction.nature = TransactionNature.BATCH
            transaction.type = TransactionType.SENT
            item?.transfers.map((tx: any) => {
              let transactionDetailsTemp: TxHistoryDetails = {
                from: '',
                walletAddress: '',
                currency: '',
                amount: 0,
                logo: '',
                amountUSD: 0,
              }
              if (tx.type === 'ETHER_TRANSFER') {
                const tokenDetails = token_map?.get(
                  '0x0000000000000000000000000000000000000000'
                )
                transactionDetailsTemp.walletAddress = tx.to
                transactionDetailsTemp.amount = Number(
                  ethers.utils.formatUnits(
                    BigNumber.from(tx.value),
                    tokenDetails?.decimals
                  )
                )
                transactionDetailsTemp.amountUSD =
                  tokenDetails.usd != undefined ? tokenDetails.usd : 0
                transaction.amountUSD +=
                  transactionDetailsTemp.amountUSD *
                  transactionDetailsTemp.amount
                transactionDetailsTemp.currency = tokenDetails.symbol
                transactionDetailsTemp.logo = tokenDetails.logoUri
                transaction.transactionDetails.push(transactionDetailsTemp)
              } else if (tx.type === 'ERC20_TRANSFER') {
                const tokenDetails = token_map?.get(
                  tx.tokenAddress.toLowerCase()
                )
                transactionDetailsTemp.walletAddress = tx.to
                transactionDetailsTemp.amount = Number(
                  ethers.utils.formatUnits(
                    BigNumber.from(tx.value),
                    tokenDetails?.decimals
                  )
                )
                transactionDetailsTemp.amountUSD =
                  tokenDetails.usd != undefined ? tokenDetails.usd : 0
                transaction.amountUSD +=
                  transactionDetailsTemp.amountUSD *
                  transactionDetailsTemp.amount
                transactionDetailsTemp.currency = tokenDetails.symbol
                transactionDetailsTemp.logo = tokenDetails.logoUri
                transaction.transactionDetails.push(transactionDetailsTemp)
              } else {
                transaction.type = TransactionType.OTHER
              }
            })
          } else if (
            item?.transfers?.length === 0 &&
            item?.data === null &&
            item?.value === '0'
          ) {
            transaction.nature = TransactionNature.OTHER
            transaction.type = TransactionType.REJECTION
          }
        } else {
          // OTHERS
          transaction.nature = TransactionNature.OTHER
          transaction.type = TransactionType.OTHER
        }

        historyTransaction.push(transaction)
      })

      return historyTransaction
    } catch (error) {
      throw error
    }
  }

  getPendingTransactions =
    async (): Promise<SafeMultisigTransactionListResponse> => {
      try {
        if (this.safeAddress !== '') {
          const safeInfo = await axios.get(
            `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}`
          )
          const result = await axios.get(
            `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/multisig-transactions/?executed=false&nonce__gte=${safeInfo.data.nonce}`
          )

          const pendingTx = result.data
          return pendingTx
        } else {
          throw new Error('Safe address not provided')
        }
      } catch (err) {
        throw err
      }
    }
}
