import * as LitJsSdk from '@lit-protocol/lit-node-client'
import { AccessControlConditions } from '@lit-protocol/types'
import { RecourceId, payloadObject } from '../utils/types'
import { getAccessControls } from '../utils/tokenConditions'
import { Web3Provider } from '@ethersproject/providers'
import { ethConnect } from '@lit-protocol/auth-browser'

export class TokenGatingSDK {
  private provider: Web3Provider | null = null
  private chainId: number
  accessControlConditions: AccessControlConditions = []
  resourceId: RecourceId
  constructor(provider: Web3Provider, chainId: number) {
    this.resourceId = {
      baseUrl: '',
      path: '',
      orgId: '',
      role: '',
      extraData: '',
    }
    this.provider = provider
    this.chainId = chainId
  }

  initialise = async (
    chain: string,
    typeOfGating: string,
    baseUrl: string,
    path: string,
    daoId: string,
    contractAddress: string,
    tokenId?: string,
    value?: string
  ): Promise<string> => {
    try {
      this.accessControlConditions = getAccessControls(
        chain,
        typeOfGating,
        contractAddress,
        tokenId,
        value
      )
      const client = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
      })
      await client.connect()
      let walletAddress = await this.provider?.getSigner().getAddress()
      walletAddress = walletAddress?.toLowerCase()
      let expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24)
      expirationDate.setDate(expirationDate.getDate() + 2)
      const authSig = await ethConnect.signAndSaveAuthMessage({
        web3: this.provider!,
        account: walletAddress!,
        chainId: this.chainId,
        resources: '',
        expiration: expirationDate.toISOString(),
      })
      this.resourceId = {
        baseUrl: baseUrl,
        path: path,
        orgId: daoId,
        role: '',
        extraData: '',
      }
      await client.saveSigningCondition({
        accessControlConditions: this.accessControlConditions,
        chain: chain,
        authSig: authSig,
        resourceId: this.resourceId,
      })
      const jwt = await client.getSignedToken({
        accessControlConditions: this.accessControlConditions,
        chain: chain,
        authSig: authSig,
        resourceId: this.resourceId,
      })
      return jwt
    } catch (error: any) {
      throw error
    }
  }

  verifyLitAccess = async (
    daoId: string,
    data: any,
    jwtData: any
  ): Promise<boolean> => {
    try {
      const client = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
      })
      await client.connect()

      const accessControlConditionsData = data.data.accessControlConditions[0]
      const accessControlConditions = [
        {
          contractAddress: accessControlConditionsData.contractAddress,
          standardContractType:
            accessControlConditionsData.standardContractType,
          chain: accessControlConditionsData.chain,
          method: accessControlConditionsData.method,
          parameters: accessControlConditionsData.parameters,
          returnValueTest: accessControlConditionsData.returnValueTest,
        },
      ]
      const resourceId = data.data.resourceId
      const chain = accessControlConditions[0].chain

      console.log({ accessControlConditions, resourceId, chain })

      let walletAddress = await this.provider?.getSigner().getAddress()
      walletAddress = walletAddress?.toLowerCase()
      let expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24)
      expirationDate.setDate(expirationDate.getDate() + 2)
      const authSig = await ethConnect.signAndSaveAuthMessage({
        web3: this.provider!,
        account: walletAddress!,
        chainId: this.chainId,
        resources: '',
        expiration: expirationDate.toISOString(),
      })
      const jwt = await client.getSignedToken({
        accessControlConditions: accessControlConditions,
        chain: chain,
        authSig,
        resourceId: resourceId,
      })

      console.log(jwt)
      const { verified, header, payload } = LitJsSdk.verifyJwt({ jwt })
      let payloadTypecasted: payloadObject = payload as payloadObject
      console.log('Payload: ', payloadTypecasted)
      if (
        payloadTypecasted.baseUrl === jwtData.baseUrl &&
        payloadTypecasted.path === jwtData.path &&
        payloadTypecasted.orgId === daoId
      ) {
        return true
      } else {
        return false
      }
    } catch (error) {
      throw error
    }
  }
}
