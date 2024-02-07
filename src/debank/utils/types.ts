export type ErrorResponse = {
  message: string
  error: string
}

export type Token = {
  id: string
  chain: string
  name: string
  symbol: string
  display_symbol: string | null
  optimized_symbol: string
  decimals: number
  logo_url: string | null
  protocol_id: string
  price: number
  is_verified: boolean
  is_core: boolean
  is_wallet: boolean
  time_at: number | null
  amount: number
  raw_amount: number
  raw_amount_hex_str: string
}
