# Ethereum Naming Service(ENS) Redirection

This feature aims to create ENS subdomains for anyone on the platform and have them point to their profile on **samudai** so **'name.samudai.eth.limo'** would point to your samudai profile using **ENS**, **Lighthouse** and **Biconomy**.

## Documentation

- ENS’s job is to map human-readable names like ‘alice.eth’ to machine-readable identifiers such as Ethereum addresses, other cryptocurrency addresses, content hashes, and metadata.

- After registering the ENS name, you get the option to create subnames for that name all this can be done mannually but to automate the whole process.

- A ENS name can be wrapped or unwrapped we used our name to be wrapped as we can tailor your subnames to our needs as we dont want the user to transfer the name or change the content hash so to do that we need to interact with the **Name Wrapper** contract of ENS to create subnames.

- To make the redirection possible we have used **Lighthouse SDK** to deploy an IPFS redirection page, and retrieve the CID(content identifier) to be set as the content hash.

- The whole process can be done using a JS script but that would require you to make 3 transactions create a subdomain(nameWrapper.setSubdnodeRecord), lock the content hash(resolver.lockContentHash), transfer the subname(nameWrapper.safeTransferFrom). To club all the 3 transactions into one we have created a **UUPSUpgradeable smart contract**.

- After a contract is upgraded/created or a new smart account is created you need to head over to NameWrapper's contract and head over to **setApprovalForAll** to approve the appropriate as the operator for your name and pass true (\* This should only be done by the owner of the name.)

- The **@samudai_xyz/web3-sdk** has a class **ClaimSubdomain** which has a function **claimSubdomain(subname:string)** which can be called to create a subname for the name **samudai.eth**.

- To make the transaction **gasless** we have integrated **Biconomy SDK** with Account Abstraction.

| Important Address       |                                            |
| ----------------------- | ------------------------------------------ |
| Proxy Contract          | 0x423de49E2D65C13FAeBe2E6877f3641C1041Ce11 |
| Implementation Contract | 0xd999ecabDAB580E4DD6363bEf5e763a968E7ad4C |
| ENS (Mainnet & Goerli)  | 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e |
| NameWrapper Mainnet     | 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401 |
| NameWrapper Goerli      | 0x114D4603199df73e7D157787f8778E21fCd13066 |

## Reference

|                          | LINKS                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| ENS Documentation        | [Link](https://docs.ens.domains/)                                          |
| Name Wrapper             | [Link](https://ens.mirror.xyz/0M0fgqa6zw8M327TJk9VmGY__eorvLAKwUwrHEhc1MI) |
| Lighthouse Documentation | [Link](https://docs.lighthouse.storage/lighthouse-1/)                      |
| Biconomy Documentation   | [Link](https://docs.biconomy.io/docs/overview)                             |
