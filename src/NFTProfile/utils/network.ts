import { Network } from '@alch/alchemy-sdk'

export const NFTNetworks = [
  {
    name: 'mainnet',
    chainId: 1,
    config: {
      apiKey: '93abA8Tod5wqSRnXxJvYnD3_gAyMSBX3', // Replace with your Alchemy API Key.
      network: Network.ETH_MAINNET, // Replace with your network.
      maxRetries: 10,
    },
  },
  {
    name: 'rinkeby',
    chainId: 4,
    config: {
      apiKey: '93abA8Tod5wqSRnXxJvYnD3_gAyMSBX3', // Replace with your Alchemy API Key.
      network: Network.ETH_RINKEBY, // Replace with your network.
      maxRetries: 10,
    },
  },
  {
    name: 'goerli',
    chainId: 5,
    config: {
      apiKey: '93abA8Tod5wqSRnXxJvYnD3_gAyMSBX3', // Replace with your Alchemy API Key.
      network: Network.ETH_GOERLI, // Replace with your network.
      maxRetries: 10,
    },
  },
  {
    name: 'polygon',
    chainId: 137,
    config: {
      apiKey: '93abA8Tod5wqSRnXxJvYnD3_gAyMSBX3', // Replace with your Alchemy API Key.
      network: Network.MATIC_MAINNET, // Replace with your network.
      maxRetries: 10,
    },
  },
]
