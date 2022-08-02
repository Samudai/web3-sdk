import {
  getNftsForOwner,
  initializeAlchemy,
  Network,
  OwnedNftsResponse,
} from '@alch/alchemy-sdk'
import { ErrorResponse } from './utils/types'

export class NFTProfile {
  private ethSettings = {
    apiKey: 'd312tFc0mqUjLj_o0gZvvJ2wBmrzs0LW', // Replace with your Alchemy API Key.
    network: Network.ETH_MAINNET, // Replace with your network.
    maxRetries: 10,
  }

  private polygonSettings = {
    apiKey: 'd312tFc0mqUjLj_o0gZvvJ2wBmrzs0LW', // Replace with your Alchemy API Key.
    network: Network.MATIC_MAINNET, // Replace with your network.
    maxRetries: 10,
  }

  private alchemyEth = initializeAlchemy(this.ethSettings)

  private alchemyPolygon = initializeAlchemy(this.polygonSettings)

  getEthProfilePPs = async (
    ethUserAddress: string
  ): Promise<OwnedNftsResponse | ErrorResponse> => {
    try {
      const res = await getNftsForOwner(this.alchemyEth, ethUserAddress)
      return res
    } catch (err: any) {
      return {
        message: 'Error while getting NFTs for user',
        error: `Error: ${err}`,
      }
    }
  }

  getMaticProfilePPs = async (
    maticUserAddress: string
  ): Promise<OwnedNftsResponse | ErrorResponse> => {
    try {
      const res = await getNftsForOwner(this.alchemyPolygon, maticUserAddress)
      return res
    } catch (err: any) {
      return {
        message: 'Error while getting NFTs for user',
        error: `Error: ${err}`,
      }
    }
  }

  setEthProfilePPs = async (
    ethUserAddress: string,
    nftLink: string,
    verified: boolean
  ) => {
    try {
      console.log('sets profile PPFs')
    } catch (err: any) {
      console.log(err)
    }
  }

  setMaticProfilePPs = async (
    maticUserAddress: string,
    nftLink: string,
    verified: boolean
  ) => {
    try {
      console.log('sets profile PPFs')
    } catch (err: any) {
      console.log(err)
    }
  }
}
