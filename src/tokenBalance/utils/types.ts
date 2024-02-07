export type ErrorResponse = {
  message: string
  error: string
}

export type UserTokenBalanceResponse = {
  name: string | null
  symbol: string | null
  balance: string | null
  contractAddress: string | null
}
