export type AccessControlConditions = {
  contractAddress: string
  standardContractType: string
  chain: string
  method: string
  parameters: string[]
  returnValueTest: {
    comparator: string
    value: string
  }
}

export type LitNetworkName = 'datil' | 'datil-test' | 'datil-dev'

/**
 * Self-describing gate token returned by `LitProtocol.encryptGate`. Modern Lit
 * (v7) replaced the JWT signing-condition flow with identity-based encryption,
 * so the gate is now a ciphertext that can only be decrypted by a wallet that
 * satisfies `accessControlConditions`. The conditions + hash must travel with
 * the token because decryption needs the exact values used to encrypt.
 */
export type LitGateToken = {
  ciphertext: string
  dataToEncryptHash: string
  accessControlConditions: AccessControlConditions[]
  chain: string
  marker: string
  network: LitNetworkName
}

export type ErrorResponse = {
  message: string
  error: string
}
