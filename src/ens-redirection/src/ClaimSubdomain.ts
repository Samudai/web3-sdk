import {ethers} from 'ethers';
import {CANNOT_SET_RESOLVER, CANNOT_UNWRAP, CAN_EXTEND_EXPIRY, ENS_DOMAIN_NAME, GOERLI_RESOLVER, PARENT_CANNOT_CONTROL, PROXY_CONTRACT_ADDRESS, PVT_KEY, RPC_URL} from '../utils/constants';
import { ImplementationContractABI } from '../contracts/Contract_ABI';
const namehash = require('@ensdomains/eth-ens-namehash');
const contentHash = require('content-hash')

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

    working = () =>{
        console.log("working fine");
    }

    setCID = (cid:string) => {
        this.cid = cid;
        console.log("CID recieved: ",this.cid);
    }

    isSubdomainAvailable =async (subname:string) : Promise<boolean> => {
        try {
            console.log("Checking Name availability....")
            const subdomainName = subname+"."+ENS_DOMAIN_NAME;
            console.log(subdomainName);
            const subdomainHash = namehash.hash(subdomainName);
            console.log(subdomainHash);
            const tx = await this.contractInstance.getData(subdomainHash);
            if(tx[0] === "0x0000000000000000000000000000000000000000")
            {
                return true;
            }else{
                return false;
            }
        } catch (error) {
            throw error;
        }
    }

    claimSubdomain = async(subname:string) : Promise<boolean> =>{
        try {
            const isAvailable = await this.isSubdomainAvailable(subname);
            if(isAvailable===true)
            {
                const cidHash = "0x"+contentHash.fromIpfs(this.cid);
                console.log("CID hash: ",cidHash);
                const fuses = PARENT_CANNOT_CONTROL | CANNOT_UNWRAP | CANNOT_SET_RESOLVER | CAN_EXTEND_EXPIRY;
                console.log("Passing all the arguments to the smart contract and calling createSubdomainWithContentHash....");
                const tx = await this.contractInstance.createSubdomainWithContentHash(this.parentHash,subname,cidHash,fuses,GOERLI_RESOLVER);
                console.log("TX: ",tx);
                console.log(`Subdomain name ${subname} created with your custom content hash!`);
                return true;
            }else{
                return false;
            }
        } catch (error) {
            throw error;
        }
    }

};