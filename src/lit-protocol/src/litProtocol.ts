import type { Signer } from 'ethers'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { encryptString, decryptToString } from '@lit-protocol/encryption'
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants'
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers'
import { TokenGatingType } from '../utils/enums'
import {
  AccessControlConditions,
  LitGateToken,
  LitNetworkName,
} from '../utils/types'
import {
  getERC20TokenGating,
  getERC1155TokenGating,
  getERC721TokenGating,
} from '../lib/tokenConditions'

const LIT_NETWORK_MAP: Record<
  LitNetworkName,
  (typeof LIT_NETWORK)[keyof typeof LIT_NETWORK]
> = {
  datil: LIT_NETWORK.Datil,
  'datil-test': LIT_NETWORK.DatilTest,
  'datil-dev': LIT_NETWORK.DatilDev,
}

/**
 * Token-gating via Lit Protocol v7.
 *
 * The deprecated `lit-js-sdk` JWT flow (saveSigningCondition / getSignedToken /
 * verifyJwt) was removed upstream. The modern equivalent is identity-based
 * encryption: `encryptGate` encrypts a marker (e.g. a member id) behind the
 * token-gating access-control conditions, and `verifyGate` proves access by
 * decrypting it with session signatures derived from the caller's wallet.
 */
export class LitProtocol {
  private network: LitNetworkName

  constructor(network: LitNetworkName = 'datil') {
    this.network = network
  }

  private buildConditions = (
    chain: string,
    contractAddress: string,
    typeOfGating: TokenGatingType,
    tokenId?: string
  ): AccessControlConditions[] => {
    if (typeOfGating === TokenGatingType.ERC20) {
      return getERC20TokenGating(contractAddress, chain)
    } else if (typeOfGating === TokenGatingType.ERC721) {
      return getERC721TokenGating(contractAddress, chain, tokenId)
    } else if (typeOfGating === TokenGatingType.ERC1155) {
      return getERC1155TokenGating(contractAddress, chain, tokenId)
    } else {
      throw new Error('Invalid token gating type')
    }
  }

  /**
   * Replaces the old `init` (which returned a JWT). Encrypts `memberId` behind
   * the token-gating conditions and returns a self-describing gate token.
   */
  encryptGate = async (args: {
    chain: string
    contractAddress: string
    typeOfGating: TokenGatingType
    memberId: string
    tokenId?: string
  }): Promise<LitGateToken> => {
    const { chain, contractAddress, typeOfGating, memberId, tokenId } = args
    const accessControlConditions = this.buildConditions(
      chain,
      contractAddress,
      typeOfGating,
      tokenId
    )

    const client = new LitNodeClient({
      litNetwork: LIT_NETWORK_MAP[this.network],
      debug: false,
    })
    await client.connect()

    try {
      const { ciphertext, dataToEncryptHash } = await encryptString(
        {
          accessControlConditions: accessControlConditions as any,
          dataToEncrypt: memberId,
        },
        client
      )

      return {
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
        chain,
        marker: memberId,
        network: this.network,
      }
    } finally {
      await client.disconnect()
    }
  }

  /**
   * Replaces the old `verifyLit(jwt, memberId)`. Returns true iff the caller's
   * wallet satisfies the gate's access-control conditions AND the decrypted
   * marker matches `expectedMemberId`.
   */
  verifyGate = async (args: {
    signer: Signer
    token: LitGateToken
    expectedMemberId: string
  }): Promise<boolean> => {
    const { signer, token, expectedMemberId } = args
    const client = new LitNodeClient({
      litNetwork: LIT_NETWORK_MAP[token.network],
      debug: false,
    })

    try {
      await client.connect()

      const resourceString =
        await LitAccessControlConditionResource.generateResourceString(
          token.accessControlConditions as any,
          token.dataToEncryptHash
        )

      const sessionSigs = await client.getSessionSigs({
        chain: token.chain,
        resourceAbilityRequests: [
          {
            resource: new LitAccessControlConditionResource(resourceString),
            ability: LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        authNeededCallback: async ({
          uri,
          expiration,
          resourceAbilityRequests,
        }: any) => {
          const toSign = await createSiweMessage({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: await signer.getAddress(),
            nonce: await client.getLatestBlockhash(),
            litNodeClient: client,
          })
          return generateAuthSig({ signer: signer as any, toSign })
        },
      })

      const decrypted = await decryptToString(
        {
          accessControlConditions: token.accessControlConditions as any,
          ciphertext: token.ciphertext,
          dataToEncryptHash: token.dataToEncryptHash,
          chain: token.chain,
          sessionSigs,
        },
        client
      )

      return decrypted === expectedMemberId
    } catch (err: any) {
      console.log(err)
      return false
    } finally {
      await client.disconnect()
    }
  }
}
