# web3-sdk-samudai

## All in one web3 integrations for Samudai

## Current Integrations on SDK

SDK currently has the following for the web3 integrations

- Gnosis - Gnosis for onchain payments
- Lit Protocol - For token gating
- NFT-PPFs - Fetching of NFT profile photos for users
- SIWE - Sign in with ethereum
- Snapshot - Snapshot for proposals

## Installation

Dillinger requires [Node.js](https://nodejs.org/).

```sh
npm i web3-sdk-samudai
```

## Usage

The SDK has the following components and the below table provides an overview to initialize them.

| Plugin       | README                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------- |
| Gnosis       | `const gnosis = new Gnosis(provider: Web3Provider, chaindId: number)`                         |
| Lit Protocol | `const litProtocol = new LitProtocol()`                                                       |
| NFT PPFs     | `const nftPPfs = new NFTProfile()`                                                            |
| SIWE         | `const siwe = new Siwe(provider: Web3Provider)`                                               |
| Snapshot     | `const snapshot = new Snapshot(spaceId: string, networkType: number, provider: Web3Provider)` |

## Gnosis APIs

Gnosis APis are used to create transactions on the multisig and fetch transactions.

To use Gnosis

### Initialize gnosis:

```sh
const gnosis = new Gnosis(provider: Web3Provider, chaindId: number)
```

### To create a single gnosis transaction

```sh
const result = await gnosis.createSingleGnosisTx(receiverAddress: string, value: string,
safeAddress: string, senderAddress: string)
```

> Param 1: `safeAddress` Gnosis safe address.
> Param 2: `receiverAddress` Wallet address of the user whom the funds is being sent.
> Param 3: `value` ETH value in wei.
> Param 4: `senderAddress` Waller address of the sender

### To create a batch gnosis transaction

```sh
const result = await gnosis.createBatchGnosisTx(safeAddress: string, receiverAddresses: string[],
value: string, senderAddress: string)
```

> Param 1: `safeAddress` Gnosis safe address.
> Param 2: `receiverAddresses` Wallet addresses of the users whom the funds is being sent.
> Param 3: `value` ETH value in wei.
> Param 4: `senderAddress` Waller address of the sender

### To get pending transactions for a safe

```sh
const result = await gnosis.getPendingTransactions(safeAddress: string)
```

> Param 1: `safeAddress` Gnosis safe address.

Example

```sh
const result = await gnosis.getPendingTransactions("0xE666431e8Ba10B17D296aB16A4FF8d9A552eb488")
```

### To get past / executed transactions for a safe

```sh
const result = await gnosis.getExecutedTransactions(safeAddress: string)
```

> Param 1: `safeAddress` Gnosis safe address.

Example

```sh
const result = await gnosis.getExecutedTransactions("0xE666431e8Ba10B17D296aB16A4FF8d9A552eb488")
```

### To get transactions details, status of a transactions for a safe transaction hash

```sh
const result = await gnosis.getTransactionDetails(safeTxHash: string)
```

> Param 1: `safeTxHash` Transaction hash of a particular safe transaction.

Example

```sh
const result = await gnosis.getTransactionDetails("0x4a429ae97dd5bac92e9eef8e28fba94cf8813474c485228e58d81f04c332c399")
```

### To connect a gnosis safe

```sh
const result = await gnosis.connectGnosis(userAddress: string)
```

> Param 1: `userAddress` User address

This will return the safes for which user is an owner and also list of all other owners for a safe

Example

```sh
const result = await gnosis.gnosisConnect("0x4a429ae97dd5bac92e9eef8e28fba94cf8813474c485228e58d81f04c332c399")
```

---

## NFT Profile APIs

NFT Profile APIs are used to fetch the NFTs owned by the user on ETH and Polygon which can later be set as profile photos

### Initialize NFT Profile Photos:

```sh
const nftProfile = new NFTProfile()
```

### To get ETH based NFTs

```sh
const ethNFTs = await nftProfile.getEthProfilePPs(ethUserAddress: string)
```

> Param 1: `ethUserAddress` Wallet Address of the user.

Example

```sh
const ethNFTs = await nftProfile.getEthProfilePPs(0xB1BFB38a527D05442D48068ca9798FD3E5d6ce0F)
```

### To get Polygon based NFTs

```sh
const polygonNFTs = await nftProfile.getMaticProfilePPs(maticUserAddress: string)
```

> Param 1: `maticUserAddress` Wallet Address of the user.

---

## Lit Protocol APIs

Lit Protocol APIs are used to for token gating

To use Lit Protocol

### Initialize Lit Protocol:

```sh
const litProtocol = new LitProtocol()
```

### To create a Lit protocol gating

```sh
const tokenGating = await litProtocol.init(
    chain: string,
    contractAddress: string,
    typeOfGating: TokenGatingType,
    baseUrl: string,
    path: string,
    memberId: string,
    tokenId?: string
)
```

> Param 1: `chain` The chain on which the Token Gating will be created. Refer the list of chains below the example.
> Param 2: `contractAddress` Contract Address of the Token.
> Param 3: `typeOfGating` Enum value of which type of Gating. Refer the enum list below the example.
> Param 4: `baseUrl` Url of the url of frontend.
> Param 5: `path` The Path that requires the token gating.
> Param 6: `memberId` Member UUID that is being authenticated.
> Param 7: `tokenId` Token ID of a NFT for verification.

> Returns: `jwt` JWT token can be set on cookies or anything on the frontend and needs to be sent to SDK for verification

Example

```sh
const tokenGating = await litProtocol.init(
    chain: "rinkeby",
    contractAddress: "0xB1BFB38a527D05442D48068ca9798FD3E5d6ce0F",
    typeOfGating: 0,
    baseUrl: "http://samudai.xyz",
    path: '/dao/f298865a-c3a3-46e1-8ff6-ffd63ec23257',
    memberId: aaaff17d-c166-430d-9afc-82c88394c7b8,
)
```

List of chains
| chain |
| ------ |
| ethereum |
| rinkeby |
| polygon |
| goerli |
| mumbai |

For further chain supports based on EVM use the following list
https://developer.litprotocol.com/supportedChains

Enum for TokenGatingType

```sh
enum TokenGatingType = {
  ERC20,
  ERC721,
  ERC1155,
}

ERC20 = 0
ERC721 = 1
ERC1155 = 2
```

### To verify the user

```sh
const result = await litProtocol.verifyLit(jwt: string, memberId: string)
```

> Param 1: `jwt` JWT generated by the init functionality.
> Param 2: `memberId` Member UUID

> Returns: verifyLit returns true / false based on the access conditions

---

## SIWE

SIWE is used for Sign in with ethereum

To use SIWE

### Initialize SIWE:

```sh
const siwe = new Siwe(provider: Web3Provider)
```

### To sign in user, you need to ask the user to sign a message and push the users to required screen after successful signing

```sh
const result = siwe.walletSignIn(domain: string)
```

> Param 1: `domain` URL of the frontend

Example

```
const result = siwe.walletSignIn("https://samudai.xyz")
```

---

## Snapshot

Snapshot is used for fetching proposals and voting for them.

To use snapshot

### Initialize Snapshot:

```sh
const snapshot = new Snapshot(spaceId: string, networkType: number, provider: Web3Provider)
```

> Param 1: `spaceId` Space ID in Snapshot
> Param 2: `networkType` 0 for Ethereum, 1 for testnets
> Param 3: `provider` Web3Provider

Example

```
const snapshot = new Snapshot("biryani.eth", 1, provider)
```

### To get information about a Space

```sh
const result = snapshot.getSpace()
```

### To get active proposals

```sh
const result = snapshot.getActiveProposals()
```

### To get Recent proposals

```sh
const result = snapshot.getRecentProposals()
```

### To cast a vote

```sh
const result = snapshot.castVote(proposalId: string, choice: number,account: any)
```
