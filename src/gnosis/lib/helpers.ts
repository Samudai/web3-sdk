import { TokenMetadataResponse } from '@alch/alchemy-sdk'
import Web3 from 'web3'
import { UserTokenBalance } from '../../tokenBalance/src/tokenbalance'

export const encodeData = (address: string, value: string): string => {
  const web3: Web3 = new Web3()
  const encodedCallData: string = web3.eth.abi.encodeFunctionCall(
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'dst', type: 'address' },
        { name: 'wad', type: 'uint256' },
      ],
    },
    [address, value]
  )
  return encodedCallData
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
