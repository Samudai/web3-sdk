import {ethers} from 'ethers';
import {CANNOT_SET_RESOLVER, CANNOT_UNWRAP, CAN_EXTEND_EXPIRY, ENS_DOMAIN_NAME, GOERLI_RESOLVER, PARENT_CANNOT_CONTROL, PROXY_CONTRACT_ADDRESS, PVT_KEY, RPC_URL} from '../utils/constants';
import { ImplementationContractABI } from '../contracts/Contract_ABI';
const namehash = require('@ensdomains/eth-ens-namehash');
const contentHash = require('content-hash')
import {transaction} from '../utils/types'

export class ClaimSubdomain{
    private cid = "";
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contractInstance: ethers.Contract;
    private parentHash = namehash.hash(ENS_DOMAIN_NAME);
    
    constructor()
    {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PVT_KEY,this.provider);
        this.contractInstance = new ethers.Contract(PROXY_CONTRACT_ADDRESS,ImplementationContractABI,this.wallet);
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
                const cidHash = "0x"+contentHash.fromIpfs(this.cid);
                const fuses = PARENT_CANNOT_CONTROL | CANNOT_UNWRAP | CANNOT_SET_RESOLVER | CAN_EXTEND_EXPIRY;
                const tx = await this.contractInstance.createSubdomainWithContentHash(this.parentHash,subname,cidHash,fuses,GOERLI_RESOLVER);
                return {
                    transactionHash:tx.hash,
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