import { Networks } from '../../gnosis/utils/networks'
import { ErrorResponse, SafeTransactions } from '../../gnosis/utils/types'
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
  ): Promise<SafeMultisigTransactionResponse | ErrorResponse> => {
    try {
      if (this.safeAddress !== '') {
        const res = await axios.get(
          `${this.txServiceUrl}/api/v1/multisig-transactions/${txHash}`
        )

        return res.data
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
