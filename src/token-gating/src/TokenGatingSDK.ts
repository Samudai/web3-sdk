import * as LitJsSdk from '@lit-protocol/lit-node-client'
import { AccessControlConditions } from '@lit-protocol/types'
import { RecourceId } from '../utils/types'
import { TokenGatingType } from '../utils/enums'
import {
  getERC1155TokenGating,
  getERC20TokenGating,
  getERC721TokenGating,
} from '../utils/tokenConditions'

export class TokenGatingSDK {
  accessControlConditions: AccessControlConditions[] = []
  resourceId: RecourceId
  constructor() {
    this.resourceId = {
      baseUrl: '',
      path: '',
      orgId: '',
      role: '',
      extraData: '',
    }
  }
  test = () => {
    console.log('TOKEN GATING WORKING')
  }
  initialise = async (
    chain: string,
    contractAddress: string,
    typeOfGating: TokenGatingType,
    baseUrl: string,
    path: string,
    memberId: string,
    tokenId?: string
  ) => {
    try {
      if (typeOfGating === TokenGatingType.ERC20) {
        this.accessControlConditions = getERC20TokenGating(
          contractAddress,
          chain
        )
      } else if (typeOfGating === TokenGatingType.ERC721) {
        this.accessControlConditions = getERC721TokenGating(
          contractAddress,
          chain,
          tokenId
        )
      } else if (typeOfGating === TokenGatingType.ERC1155) {
        this.accessControlConditions = getERC1155TokenGating(
          contractAddress,
          chain,
          tokenId
        )
      } else {
        throw new Error('Invalid token gating type')
      }
      this.resourceId = {
        baseUrl: baseUrl,
        path: path,
        orgId: '',
        role: '',
        extraData: memberId,
      }
      const client = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        litNetwork: 'cayenne',
      })
      await client.connect()
      // const authSig = await LitJsSdk.checkAndSignAuthMessage({
      //   chain: chain,
      //   nonce: client.getLatestBlockhash()!,
      // })
      // console.log('AUTHSIG: ', authSig)
    } catch (error: any) {
      throw error
    }
  }
}
