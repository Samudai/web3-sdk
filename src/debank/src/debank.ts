import axios from 'axios'
import { dummyData } from '../utils/dummyData'
import { ErrorResponse, Token } from '../utils/types'

export class Debank {
  apiKey = 'd8199f9160ac89b42f5659ca74c9444b9849c0ef'

  getUserTokenBalance = async (
    userAddress: string
  ): Promise<Token[] | ErrorResponse> => {
    try {
      const url = `https://pro-openapi.debank.com/v1/user/all_token_list?id=${userAddress}`

      const res = await axios.get(url, {
        headers: {
          AccessKey: this.apiKey,
        },
      })

      return res.data
    } catch (err: any) {
      return {
        message: 'error',
        error: `${err}`,
      }
    }
  }

  getDummyData = (): Token[] | ErrorResponse => {
    try {
      const data: Token[] = dummyData

      return data
    } catch (err: any) {
      return {
        message: 'error',
        error: `${err}`,
      }
    }
  }
}
