import { Networks } from '../../gnosis/utils/networks'
import {
  ErrorResponse,
  SafeTransactions,
  TransactionDetails,
} from '../../gnosis/utils/types'
import axios from 'axios'
import {
  SafeMultisigTransactionResponse,
  SafeBalanceUsdResponse,
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

  getExecutedTransactions = async (): Promise<
    SafeTransactions | ErrorResponse
  > => {
    try {
      if (this.safeAddress !== '') {
        const res = await axios.get(
          `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/multisig-transactions/?executed=true`
        )

        return res.data
      } else {
        return {
          message: 'Error while fetching pending transactions',
          error: `Safe address is not set`,
        }
      }
    } catch (err) {
      return {
        message: 'Error while fetching pending transactions',
        error: `${err}`,
      }
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
        return {
          message: 'Error while fetching pending transactions',
          error: `Safe address is not set`,
        }
      }
    } catch (err) {
      return {
        message: 'Error while fetching pending transactions',
        error: `${err}`,
      }
    }
  }

  getTransactionDetails = async (
    txHash: string
  ): Promise<TransactionDetails | ErrorResponse> => {
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
        return {
          message: 'Error while fetching transaction details',
          error: `Safe address is not set`,
        }
      }
    } catch (err) {
      return {
        message: 'Error while fetching transaction details',
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

      for (const owner of safeOwners) {
        //const address = (await this.provider?.lookupAddress(owner)) || owner
        owners.push(owner)
      }

      return owners
    } catch (err) {
      return null
    }
  }

  getSafeBalance = async (): Promise<
    SafeBalanceUsdResponse[] | ErrorResponse
  > => {
    try {
      const result = await axios.get(
        `${this.txServiceUrl}/api/v1/safes/${this.safeAddress}/balances/usd/?trusted=false&exclude_spam=false`
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
}
