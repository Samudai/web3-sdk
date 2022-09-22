import Web3 from 'web3'

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
