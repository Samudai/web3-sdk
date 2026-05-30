import { ethers, BrowserProvider, TransactionResponse } from 'ethers'
import ContractABI from '../contracts/abi.json'
import { GatewayURL } from '../utils/constants'

export class Subdomain {
  private chainId: number | null = null
  private contractAddress = ''
  private gatewayURL = ''
  constructor(env: string) {
    //this.chainId = chainId
    this.gatewayURL = GatewayURL.find((item) => item.env === env)?.url || ''
    this.contractAddress = '0xfFAeF3F8A37014B932334D283f90a2408Eba0328'
  }

  claimSubdomain = async (
    username: string,
    provider: BrowserProvider
    // member_id: string,
    // jwt: string
  ): Promise<boolean> => {
    try {
      // const memberCountResult = await axios.get(
      //   `${this.gatewayURL}/api/member/get/invitecount/${member_id}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${jwt}`,
      //     },
      //   }
      // )

      // const memberCount = memberCountResult.data.data.count

      if (provider && this.contractAddress) {
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        const contract = new ethers.Contract(
          this.contractAddress,
          ContractABI,
          signer
        )

        const message = JSON.stringify({
          address: address,
          timestamp: Date.now(),
          message: 'I am claiming this subdomain',
        })
        const encoded = ethers.solidityPackedKeccak256(['string'], [message])

        const signature = await signer.signMessage(ethers.getBytes(encoded))

        const tx: TransactionResponse = await contract.claimSubdomain(
          username,
          message,
          signature
        )
        await tx.wait()

        if (tx) {
          return true
        } else {
          return false
        }
      } else {
        throw new Error('Invalid provider or contract address')
      }
    } catch (err: any) {
      throw err
    }
  }
}
