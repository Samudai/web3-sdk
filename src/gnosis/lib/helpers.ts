import { TokenMetadataResponse } from 'alchemy-sdk'
import { Interface } from 'ethers'
import { UserTokenBalance } from '../../tokenBalance/src/tokenbalance'

export const encodeData = (address: string, value: string): string => {
  const iface = new Interface(['function transfer(address dst, uint256 wad)'])
  return iface.encodeFunctionData('transfer', [address, value])
}

export const getDecimalsForToken = async (
  chainId: number,
  tokenAddress: string
) => {
  const userTokenBalance = new UserTokenBalance()

  const tokenMetaData: TokenMetadataResponse =
    await userTokenBalance.getTokenMetadata(chainId, tokenAddress)

  return tokenMetaData.decimals
}
