import axios from 'axios'
import { Message, User, APIResult } from '../utils/types'
import { Provider, Web3Provider } from '@ethersproject/providers'
import { formatBytes32String } from '@ethersproject/strings'
import { BigNumber } from '@ethersproject/bignumber'
import { utils } from 'ethers'

import {
  IdRegistry,
  IdRegistry__factory,
  NameRegistry,
  NameRegistry__factory,
} from '../lib/contracts'
import { GOERLI_ADDRESS } from '../utils/network'

export class Farcaster {
  private API_URL = 'https://api.farcaster.xyz/v1'

  //   private nameRegistry: Promise<NameRegistry>
  //   private idRegistry: Promise<IdRegistry>

  //   private username: string

  //   constructor() {

  //   }

  private validateUsername = (username: string): void => {
    const unameBytes = utils.toUtf8Bytes(username)
    if (unameBytes.length > 16) {
      throw new Error('username cannot be greater than 16 characters')
    }
    if (unameBytes.length === 0) {
      throw new Error('username cannot be empty string')
    }
    let nameEnded = false

    /**
     * Iterate over the bytes16 fname one char at a time, ensuring that:
     *   1. The name begins with [a-z 0-9] or the ascii numbers [48-57, 97-122] inclusive
     *   2. The name can contain [a-z 0-9 -] or the ascii numbers [45, 48-57, 97-122] inclusive
     *   3. Once the name is ended with a NULL char (0), the follows character must also be NULLs
     */

    // If the name begins with a hyphen, reject it
    if (unameBytes[0] === 45) throw new Error('invalid name')

    unameBytes.forEach((charInt, index) => {
      if (nameEnded) {
        // Only NULL characters are allowed after a name has ended
        if (charInt !== 0) {
          throw new Error('invalid name')
        }
      } else {
        // Only valid ASCII characters [45, 48-57, 97-122] are allowed before the name ends

        // Check if the character is a-z
        if (charInt >= 97 && charInt <= 122) {
          return
        }

        // Check if the character is 0-9
        if (charInt >= 48 && charInt <= 57) {
          return
        }

        // Check if the character is a hyphen
        if (charInt === 45) {
          return
        }

        // On seeing the first NULL char in the name, revert if is the first char in the
        // name, otherwise mark the name as ended
        if (charInt === 0) {
          // We check i==1 instead of i==0 because i is incremented before the check
          if (index === 1) throw new Error('invalid name')
          nameEnded = true
          return
        }

        throw new Error('invalid name')
      }
    })
  }

  private usernameToTokenId = (username: string) => {
    this.validateUsername(username)
    const unameBytes = formatBytes32String(username)
    return BigNumber.from(unameBytes)
  }

  private getAddressForUsername = async (
    web3Provider: Provider,
    username: string
  ): Promise<string | undefined> => {
    try {
      const nameRegistry = (async (): Promise<NameRegistry> => {
        const contractAddress = GOERLI_ADDRESS.nameRegistry
        return NameRegistry__factory.connect(contractAddress, web3Provider)
      })()
      const ownrAddress = await (
        await nameRegistry
      ).ownerOf(this.usernameToTokenId(username))

      return ownrAddress
    } catch (err) {
      return undefined
    }
  }

  private getFarcasterID = async (
    address: string,
    web3Provider: Web3Provider
  ): Promise<BigNumber> => {
    const idRegistryValue = (async (): Promise<IdRegistry> => {
      const contractAddress: string = GOERLI_ADDRESS.idRegistry
      return IdRegistry__factory.connect(contractAddress, web3Provider)
    })()
    const idRegistry = await idRegistryValue
    return await idRegistry.idOf(address)
  }

  private lookupByAddress = async (
    address: string,
    web3Provider: Web3Provider
  ): Promise<User | undefined> => {
    const response = await axios.get(`${this.API_URL}/profiles/${address}`)

    const userWithoutFID = response.data.result.user

    const farcasterID = await this.getFarcasterID(address, web3Provider)

    const user: User = {
      ...userWithoutFID,
      farcasterID: farcasterID.toString(),
    }

    return user
  }

  getUserLatestActvity = async (
    userOrAddress: User | string
  ): Promise<Message[]> => {
    try {
      const address =
        typeof userOrAddress === 'string'
          ? userOrAddress
          : userOrAddress.address
      utils.getAddress(address)
      const response = await axios.get<APIResult<Message[]>>(
        `${this.API_URL}/profiles/${address}/casts`
      )
      return response.data.result
    } catch (err) {
      return []
    }
  }

  lookupByUsername = async (
    username: string,
    web3Provider: Web3Provider
  ): Promise<User | undefined> => {
    try {
      const ownrAddr = await this.getAddressForUsername(web3Provider, username)
      if (ownrAddr) {
        return await this.lookupByAddress(ownrAddr, web3Provider)
      } else {
        return undefined
      }
    } catch (err) {
      return undefined
    }
  }
}
