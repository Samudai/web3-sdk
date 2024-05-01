import { Alchemy, WebhookType, Network } from 'alchemy-sdk'
import { authToken } from '../utils/constants'
export class Points {
  private alchemy: Alchemy
  private authToken = ''
  private networkName: Network
  constructor(chainId: number) {
    this.authToken = authToken
    if (chainId === 1) {
      this.networkName = Network.ETH_MAINNET
    } else if (chainId === 137) {
      this.networkName = Network.MATIC_MAINNET
    } else if (chainId === 80002) {
      this.networkName = Network.MATIC_AMOY
    } else {
      this.networkName = Network.ETH_SEPOLIA
    }
    this.alchemy = new Alchemy({
      authToken: this.authToken,
      network: this.networkName,
    })
  }

  createWebhook = async (
    webhookAddress: string,
    contractAddress: string,
    topics: string[]
  ) => {
    const graphql_query = `{
        block {
           hash,
           number,
           timestamp,
           logs(filter: {
             addresses: [${contractAddress}],
             topics: ${topics}
           }) {
             data,
             topics,
             index,
             account {
               address
             },
             transaction {
               hash,
               nonce,
               index,
               from {
                 address
               },
               to {
                 address
               },
               value,
               gasPrice,
               maxFeePerGas,
               maxPriorityFeePerGas,
               gas,
               status,
               gasUsed,
               cumulativeGasUsed,
               effectiveGasPrice,
               createdContract {
                 address
               }
             }
           }
        }
       }`
    const graphql = await this.alchemy.notify.createWebhook(
      webhookAddress,
      WebhookType.GRAPHQL,
      {
        network: this.networkName,
        graphqlQuery: graphql_query,
      }
    )
  }
}
