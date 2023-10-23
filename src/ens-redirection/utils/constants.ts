export const PVT_KEY =
  '112f70840b01251f62a37e7be943dcdaca0601fd5c6499af15ed9c40b7690151'
export const ENS_DOMAIN_NAME = 'venkateshsv.eth' //change

export const GOERLI = {
  RESOLVER: '0x59c227Bac76bB479FbD51e12032fDDD7179aBf9F',
  PROXY_CONTRACT_ADDRESS: '0x54E7069E36767F637141567cCE3ad689D9B3f678',
  RPC_URL: 'https://goerli.infura.io/v3/fd7b0732ea0f457f8113c36482bff83e',
  PAYMASTER_URL:
    'https://paymaster.biconomy.io/api/v1/5/EdcQRGlHi.d9e4aa4a-17ad-4247-abaf-71e931e0ec69',
  BUNDLER_URL:
    'https://bundler.biconomy.io/api/v2/5/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44',
}

export const MAINNET = {
  RESOLVER: '0x7759277C7E6c34230840c4C28d799fBb643CB23f',
  PROXY_CONTRACT_ADDRESS: '0x423de49E2D65C13FAeBe2E6877f3641C1041Ce11',
  RPC_URL: 'https://mainnet.infura.io/v3/fd7b0732ea0f457f8113c36482bff83e',
  PAYMASTER_URL:
    'https://paymaster.biconomy.io/api/v1/1/h8EwFOKGW.b97fed01-8bb9-42f5-932a-8137a995516a',
  BUNDLER_URL:
    'https://bundler.biconomy.io/api/v2/1/hjJ79w0.jkL90oYh-iJkl-45ic-jdS9-nj789sb78Cv',
}

// FUSES
export const CANNOT_UNWRAP = 1
export const CANNOT_BURN_FUSES = 2
export const CANNOT_TRANSFER = 4
export const CANNOT_SET_RESOLVER = 8
export const CANNOT_SET_TTL = 16
export const CANNOT_CREATE_SUBDOMAIN = 32
export const CANNOT_APPROVE = 64
//uint16 reserved for parent controlled fuses from bit 17 to bit 32
export const PARENT_CANNOT_CONTROL = 1 << 16
export const IS_DOT_ETH = 1 << 17
export const CAN_EXTEND_EXPIRY = 1 << 18
export const CAN_DO_EVERYTHING = 0
export const PARENT_CONTROLLED_FUSES = 0xffff0000
// all fuses apart from IS_DOT_ETH
export const USER_SETTABLE_FUSES = 0xfffdffff
