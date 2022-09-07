export type Auth = {
  walletAddress: string
  signature: string
  auth_msg: string
}

export type ErrorResponse = {
  error: string
  message: string
}

export type TxData = {
  proposalName: string
  description: string
  disbursement: Disbursement[]
}

export type Disbursement = {
  token_address: string
  amount: number
  address: string
  tag_name: string
  category: string
  amount_type: 'TOKEN'
  referenceLink: string
}
