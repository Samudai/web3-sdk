import { JsonRpcSigner, BrowserProvider } from 'ethers'
import { SiweMessage, generateNonce } from 'siwe'
import { SiweResponse } from '../utils/types'

export class Siwe {
  private provider: BrowserProvider

  constructor(provider: BrowserProvider) {
    this.provider = provider
  }

  private createMessage = async (
    address: string,
    statement: string,
    domain: string
  ): Promise<string> => {
    try {
      const nonce = generateNonce()
      const validFor = 24 * 60 * 60 * 1000
      const expirationDate = new Date(Date.now() + validFor).toISOString()
      const message = new SiweMessage({
        domain: domain,
        address: address,
        uri: origin,
        version: '1',
        chainId: 1,
        statement: statement,
        nonce: nonce,
        expirationTime: expirationDate,
      })
      return message.prepareMessage()
    } catch (err) {
      console.log(err)
      return `Error: ${err}`
    }
  }

  walletSignIn = async (domain: string): Promise<SiweResponse> => {
    try {
      const signer: JsonRpcSigner = await this.provider.getSigner()
      const address: string = await signer.getAddress()
      const message: string = await this.createMessage(
        address,
        'Samudai DAO Dashboard Sign In Request',
        domain
      )

      const signature: string = await signer.signMessage(message)
      return {
        message: message,
        signature: signature,
        error: null,
      }
    } catch (err: any) {
      return {
        message: '',
        signature: '',
        error: {
          message: 'Error while signing message',
          error: `Error: ${err}`,
        },
      }
    }
  }
}
