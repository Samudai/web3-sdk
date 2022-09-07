import { ethers } from 'ethers'
import axios from 'axios'
import { Networks } from '../utils/network'
import { Auth, TxData } from '../utils/types'

export class Parcel {
  private serviceUrl = ''
  private app_token = 'Samudai.Staging.5ca71d47-8344-4764-aa2f-2ffe6bcc9828'
  private chainId: number

  constructor(chainId: number) {
    this.chainId = chainId
    Networks.forEach((network) => {
      if (network.chainId === chainId) {
        this.serviceUrl = network.url
      }
    })
  }

  getSafes = async (auth: Auth) => {
    try {
      const response = await axios.post(
        `${this.serviceUrl}/safes`,
        {
          auth: {
            walletAddress: auth.walletAddress,
            auth_msg: auth.auth_msg,
            signature: auth.signature,
          },
        },
        {
          headers: {
            'x-parcel-app-token': this.app_token,
            'x-parcel-network': this.chainId,
          },
        }
      )

      const data = response.data

      return data
    } catch (err) {
      return {
        message: 'Error while fetching safes',
        error: err,
      }
    }
  }

  getSafeBalanceForParcel = async (safeAddress: string, auth: Auth) => {
    try {
      const response = await axios.post(
        `${this.serviceUrl}/safes/balances/${safeAddress}`,
        {
          auth: {
            walletAddress: auth.walletAddress,
            auth_msg: auth.auth_msg,
            signature: auth.signature,
          },
        },
        {
          headers: {
            'x-parcel-app-token': this.app_token,
            'x-parcel-network': this.chainId,
          },
        }
      )

      const data = response.data
      return data
    } catch (err) {
      return {
        message: 'Error while fetching safe balance',
        error: err,
      }
    }
  }

  createTxOnParcel = async (
    safeAddress: string,
    auth: Auth,
    tx: TxData
  ): Promise<any> => {
    try {
      const response = await axios.post(
        `${this.serviceUrl}/safes/transactions/${safeAddress}`,
        {
          auth: {
            walletAddress: auth.walletAddress,
            auth_msg: auth.auth_msg,
            signature: auth.signature,
          },
          tx: tx,
        },
        {
          headers: {
            'x-parcel-app-token': this.app_token,
            'x-parcel-network': this.chainId,
          },
        }
      )

      const data = response.data
      return data
    } catch (err) {
      return {
        message: 'Error while creating transaction',
        error: err,
      }
    }
  }
}
