export const LIGHTHOUSE_TOKEN = "02d70763.26a4121018614b60b6aee4499e5fb525";
export const PVT_KEY = "827ead3af1fe623e22e2d805c2c72cbe2701c4971f351c30d4e0302b8f11c04f";
export const RPC_URL = 'https://goerli.infura.io/v3/a87b540865194fbeb48637aed1e122e2';
export const PROXY_CONTRACT_ADDRESS = "0x6F581A889f7C0B613a87Bf01c83ad3A309e3a8b5";
export const ENS_DOMAIN_NAME = "venkatesh.eth";

// FUSES
export const CANNOT_UNWRAP = 1;
export const CANNOT_BURN_FUSES = 2;
export const CANNOT_TRANSFER = 4;
export const CANNOT_SET_RESOLVER = 8;
export const CANNOT_SET_TTL = 16;
export const CANNOT_CREATE_SUBDOMAIN = 32;
export const CANNOT_APPROVE = 64;
//uint16 reserved for parent controlled fuses from bit 17 to bit 32
export const PARENT_CANNOT_CONTROL = 1 << 16;
export const IS_DOT_ETH = 1 << 17;
export const CAN_EXTEND_EXPIRY = 1 << 18;
export const CAN_DO_EVERYTHING = 0;
export const PARENT_CONTROLLED_FUSES = 0xFFFF0000;
// all fuses apart from IS_DOT_ETH
export const USER_SETTABLE_FUSES = 0xFFFDFFFF;

// RESOLVERS
export const ETHEREUM_MAINNET_RESOLVER = "0x7759277C7E6c34230840c4C28d799fBb643CB23f";
export const GOERLI_RESOLVER = "0x59c227Bac76bB479FbD51e12032fDDD7179aBf9F";




// https://app.samudai.xyz/redirect?id=<MEMBER_ID>