import {
  Alchemy,
  AlchemySettings,
  Network,
  OwnedNftsResponse,
} from 'alchemy-sdk'
import { ErrorResponse } from '../utils/types'
import { NFTNetworks } from '../utils/network'
export class NFTProfile {
  private alchemy: Alchemy
  private config: AlchemySettings

  constructor(chainId: number) {
    const network = NFTNetworks.find((network) => network.chainId === chainId)
    if (!network) {
      throw new Error('Invalid chainId')
    }
    this.config = {
      ...network.config,
      network: network.config.network as Network,
    }
    this.alchemy = new Alchemy(this.config)
  }

  getNFTProfilePPs = async (
    userAddress: string
  ): Promise<OwnedNftsResponse> => {
    try {
      const res = await this.alchemy.nft.getNftsForOwner(userAddress)
      return res
    } catch (err: any) {
      throw err
    }
  }

  // setEthProfilePPs = async (
  //   ethUserAddress: string,
  //   nftLink: string,
  //   verified: boolean
  // ): Promise<any> => {
  //   try {
  //     console.log('sets profile PPFs')
  //   } catch (err: any) {
  //     console.log(err)
  //   }
  // }

  // setMaticProfilePPs = async (
  //   maticUserAddress: string,
  //   nftLink: string,
  //   verified: boolean
  // ): Promise<any> => {
  //   try {
  //     console.log('sets profile PPFs')
  //   } catch (err: any) {
  //     console.log(err)
  //   }
  // }
}
