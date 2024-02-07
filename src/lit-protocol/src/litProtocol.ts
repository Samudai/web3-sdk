import LitJsSdk from 'lit-js-sdk'
import { TokenGatingType } from '../utils/enums'
import {
  AccessControlConditions,
  ErrorResponse,
  RecourceId,
} from '../utils/types'
import {
  getERC20TokenGating,
  getERC1155TokenGating,
  getERC721TokenGating,
} from '../lib/tokenConditions'

export class LitProtocol {
  accessControlConditions: AccessControlConditions[] = []
  resourceId: RecourceId = {
    baseUrl: '',
    path: '',
    orgId: '',
    role: '',
    extraData: '',
  }

  init = async (
    chain: string,
    contractAddress: string,
    typeOfGating: TokenGatingType,
    baseUrl: string,
    path: string,
    memberId: string,
    tokenId?: string
  ): Promise<string> => {
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
      })
      await client.connect()
      const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: chain })
      await client.saveSigningCondition({
        accessControlConditions: this.accessControlConditions,
        chain,
        authSig,
        resourceId: this.resourceId,
      })

      const jwt: string = await client.getSignedToken({
        accessControlConditions: this.accessControlConditions,
        chain,
        authSig,
        resourceId: this.resourceId,
      })

      return jwt
    } catch (err: any) {
      throw err
    }
  }

  verifyLit = async (jwt: string, memberId: string): Promise<boolean> => {
    try {
      if (!jwt) {
        return false
      } else {
        const { verified, payload } = LitJsSdk.verifyJwt({ jwt })

        if (
          payload.baseUrl !== this.resourceId.baseUrl ||
          payload.path !== this.resourceId.path ||
          payload.extraData !== memberId
        ) {
          return false
        } else {
          return true
        }
      }
    } catch (err: any) {
      console.log(err)
      return false
    }
  }
}
