/* eslint-disable prefer-const */
import {
  Alchemy,
  AlchemyConfig,
  TokenBalance,
  TokenMetadataResponse,
} from 'alchemy-sdk'

import { Networks } from '../utils/networks'

import { ErrorResponse, UserTokenBalanceResponse } from '../utils/types'

export class UserTokenBalance {
  getBalance = async (
    chainId: number,
    address: string
  ): Promise<UserTokenBalanceResponse[] | ErrorResponse> => {
    try {
      const network = Networks.find((network) => network.chainId === chainId)
      if (!network) {
        throw new Error('Invalid chainId')
      }
      const config = {
        apiKey: network.config.apiKey,
        network: network.config.network,
      }
      const alchemy = new Alchemy(config)

      const tokenBalances: UserTokenBalanceResponse[] = []
      const balances = await alchemy.core.getTokenBalances(address)

      const nonZeroBalances = balances.tokenBalances.filter(
        (token: TokenBalance) => {
          return (
            token.tokenBalance !==
            '0x0000000000000000000000000000000000000000000000000000000000000000'
          )
        }
      )

      for (let token of nonZeroBalances) {
        let balance = token.tokenBalance!

        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress
        )

        const balanceNum = parseInt(balance) / Math.pow(10, metadata.decimals!)
        balance = balanceNum.toFixed(2)

        tokenBalances.push({
          name: metadata.name,
          symbol: metadata.symbol,
          balance: balance,
          contractAddress: token.contractAddress,
        })
      }
      return tokenBalances
    } catch (err) {
      return {
        message: 'Error while getting token balances',
        error: `Error: ${err}`,
      }
    }
  }

  getTokenMetadata = async (
    chainId: number,
    tokenAddress: string
  ): Promise<TokenMetadataResponse> => {
    try {
      const network = Networks.find((network) => network.chainId === chainId)
      if (!network) {
        throw new Error('Invalid chainId')
      }
      const config = {
        apiKey: network.config.apiKey,
        network: network.config.network,
      }
      const alchemy = new Alchemy(config)

      const metadata = await alchemy.core.getTokenMetadata(tokenAddress)
      return metadata
    } catch (err) {
      throw new Error(`Error while getting token metadata: ${err}`)
    }
  }
}
