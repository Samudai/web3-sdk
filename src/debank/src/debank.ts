import axios from 'axios'

export class Debank {
  apiKey = 'd8199f9160ac89b42f5659ca74c9444b9849c0ef'

  getUserTokenBalance = async (userAddress: string) => {
    const url = `https://pro-openapi.debank.com/v1/user/all_token_list?id=${userAddress}=false`

    const res = await axios.get(url, {
      headers: {
        AccessKey: this.apiKey,
      },
    })

    return res.data
  }
}
