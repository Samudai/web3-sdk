import { Network } from 'alchemy-sdk'

export const Networks = [
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
    name: 'sepolia',
    chainId: 11155111,
    config: {
      apiKey: '93abA8Tod5wqSRnXxJvYnD3_gAyMSBX3', // Replace with your Alchemy API Key.
      network: Network.ETH_SEPOLIA, // Replace with your network.
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
