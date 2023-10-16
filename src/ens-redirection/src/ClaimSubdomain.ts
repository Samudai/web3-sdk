import {ethers} from 'ethers';
import {CANNOT_SET_RESOLVER, CANNOT_UNWRAP, CAN_EXTEND_EXPIRY, ENS_DOMAIN_NAME, ETHEREUM_MAINNET_RESOLVER, GOERLI_RESOLVER, GOERLI_RPC_URL, OWNER_ADDRESS, PARENT_CANNOT_CONTROL, PROXY_CONTRACT_ADDRESS, PVT_KEY} from '../utils/constants';
import { ImplementationContractABI } from '../contracts/Contract_ABI';
const namehash = require('@ensdomains/eth-ens-namehash');
const contentHash = require('content-hash');
import {transaction} from '../utils/types';
import { IBundler, Bundler } from '@biconomy/bundler';
import { BiconomySmartAccountV2,DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account";
import { ChainId } from "@biconomy/core-types";
import { 
    IPaymaster, 
    BiconomyPaymaster,  
    IHybridPaymaster,
    PaymasterMode,
    SponsorUserOperationDto, 
  } from '@biconomy/paymaster';
  import { ECDSAOwnershipValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE } from "@biconomy/modules";

export class ClaimSubdomain{
    private cid = "";
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contractInstance: ethers.Contract;
    private parentHash = namehash.hash(ENS_DOMAIN_NAME);
    private bundler: IBundler;
    private paymaster:IPaymaster;

    constructor()
    {
        this.provider = new ethers.providers.JsonRpcProvider(GOERLI_RPC_URL);
        this.wallet = new ethers.Wallet(PVT_KEY,this.provider);
        this.contractInstance = new ethers.Contract(PROXY_CONTRACT_ADDRESS,ImplementationContractABI,this.wallet);
        this.bundler = new Bundler({
            bundlerUrl:"https://bundler.biconomy.io/api/v2/5/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
            chainId:ChainId.GOERLI,
            entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        });
        this.paymaster = new BiconomyPaymaster({
            paymasterUrl:"https://paymaster.biconomy.io/api/v1/5/EdcQRGlHi.d9e4aa4a-17ad-4247-abaf-71e931e0ec69"
        })
    }

    createSmartAccount = async() => {
        const module = await ECDSAOwnershipValidationModule.create({
            signer: this.wallet,
            moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
        });
        let biconomySmartAccount = await BiconomySmartAccountV2.create({
            chainId: ChainId.GOERLI,
            bundler: this.bundler,
            paymaster: this.paymaster, 
            entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
            defaultValidationModule: module,
            activeValidationModule: module
        });
        return biconomySmartAccount;
    }

    setCID = (cid:string) => {
        try {
            this.cid = cid;
        } catch (error) {
            throw new Error("Error setting CID.");
        }
        
    }

    isSubdomainAvailable =async (subname:string) : Promise<boolean> => {
        try {
            const subdomainName = subname+"."+ENS_DOMAIN_NAME;
            const subdomainHash = namehash.hash(subdomainName);
            const tx = await this.contractInstance.getData(subdomainHash);
            if(tx[0] === "0x0000000000000000000000000000000000000000")
            {
                return true;
            }else{
                return false;
            }
        } catch (error) {
            throw new Error("Error finding the availability of subdomain.");
        }
    }

    claimSubdomain = async(subname:string) : Promise<transaction> =>{
        try {
            const isAvailable = await this.isSubdomainAvailable(subname);
            if(isAvailable===true && subname!=="")
            {
                let smartAccount = await this.createSmartAccount();
                const cidHash = "0x"+contentHash.fromIpfs(this.cid);
                const fuses = PARENT_CANNOT_CONTROL | CANNOT_UNWRAP | CANNOT_SET_RESOLVER | CAN_EXTEND_EXPIRY;
                const minTx = await this.contractInstance.populateTransaction.createSubdomainWithContentHashV2(this.parentHash,subname,cidHash,fuses,GOERLI_RESOLVER,OWNER_ADDRESS);
                const tx = {
                    to: PROXY_CONTRACT_ADDRESS,
                    data: minTx.data
                }
                let userOp = await smartAccount.buildUserOp([tx]);
                const biconomyPaymaster = smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
                let paymasterServiceData: SponsorUserOperationDto = {
                    mode: PaymasterMode.SPONSORED,
                    smartAccountInfo: {
                    name: 'BICONOMY',
                    version: '2.0.0'
                    },
                };
                const paymasterAndDataResponse = await biconomyPaymaster.getPaymasterAndData(
                    userOp,
                    paymasterServiceData
                );
                userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
                const userOpResponse = await smartAccount.sendUserOp(userOp);
                const { receipt } = await userOpResponse.wait(1);    
                return {
                    transactionHash:receipt.transactionHash,
                    success:true
                }
            }else{
                return {
                    transactionHash:"",
                    success:false
                }
            }
        } catch (error) {
            throw new Error("Error claiming the subdomain.");
        }
    }

};