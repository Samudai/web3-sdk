// import SmartAccount from '@biconomy/smart-account'
// import { Web3Provider } from '@ethersproject/providers'

// // Create a new instance of SmartAccount

// export const initFunction = async (provider: Web3Provider) => {
//   const options = {
//     activeNetworkId: 1, // ETH Chain ID
//     supportedNetworksIds: [1], // Array, ETH Chain IDs
//     // Network Config.
//     // Link Paymaster / DappAPIKey for the chains you'd want to support Gasless transactions on
//     networkConfig: [
//       {
//         chainId: 1, // ETH Chain ID
//         dappAPIKey: 'NqGz-pwn3.87fdd991-3a8b-48a6-950c-99a806ccf2a9', // if you are using Biconomy Paymaster configured from a Dashboard
//         // customPaymasterAPI: <IPaymaster Instance of your own Paymaster>
//       },
//     ],
//   }

//   let smartAccount = new SmartAccount(provider, options)
//   smartAccount = await smartAccount.init()
//   return smartAccount
// }
