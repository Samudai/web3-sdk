export type SiweResponse = {
  message: string
  signature: string
  error: ErrorResponse | null
}

export type ErrorResponse = {
  message: string
  error: string
}
