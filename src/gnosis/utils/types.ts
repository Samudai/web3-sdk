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

export type SafeTransactionResponse = {
  safeTxHash: string
  proposedSafeTx: any
}

export type SafeTransactions = {
  count: number
  next: string | null
  previous: string | null
  results: MultisigTransactionResponse[]
}

export type MultisigTransactionResponse = {
  safe: string
  to: string
  value: string
  data: string | null
  operation: number
  gasToken: string
  safeTxGas: string
  baseGas: string
  gasPrice: string
  refundReceiver: string
  nonce: string
  executionDate: string
  submissionDate: string
  modified: string
  blockNumber: number
  transactionHash: string
  safeTxHash: string
  executor: string
  isExecuted: boolean
  isSuccessful: boolean
  ethGasPrice: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasUsed: string
  fee: string
  origin: string
  dataDecoded: string
  confirmationsRequired: number
  confirmations: MultisigConfirmations[]
  trusted: boolean
  signatures: string
}

export type MultisigConfirmations = {
  description: string
  owner: string
  submissionDate: string
  transactionHash: string
  signature: string
  signatureType: string
}
