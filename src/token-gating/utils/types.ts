export type RecourceId = {
  baseUrl: string
  path: string
  orgId: string
  role: string
  extraData: string
}

export type payloadObject = {
  baseUrl: string
  path: string
  orgId: string
}

export type ErrorResponse = {
  message: string
  error: string
}
