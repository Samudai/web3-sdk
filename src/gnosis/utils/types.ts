import { Web3Provider } from '@ethersproject/providers'

export type GnosisTx = {
  safeAddress: string
  provider: Web3Provider
  chainId: number
  receiver: string
  valueInWei: string
}

export type SafeTransactionTemplate = {
  to: string
  value?: string
  data?: string
  operation?: number
  safeTxGas?: number
  baseGas?: number
  gasPrice?: number
  gasToken?: string
  refundReceiver?: string
  nonce: number
}

export type ErrorResponse = {
  message: string
  error: string
}
