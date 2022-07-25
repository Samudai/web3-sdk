import { AddressZero } from '@ethersproject/constants';
import Safe from '@gnosis.pm/safe-core-sdk';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import axios from 'axios';
import { ethers } from 'ethers';
export class Gnosis {
    /**
     *
     * @param provider Web3Provider - The provider to use for interacting with the Gnosis Safe
     * @param chainId number - The chain ID of the Wallet
     */
    constructor(provider, chainId) {
        this.safeAddress = '';
        this.provider = null;
        this.chainId = 0;
        this.etherAdapter = null;
        this.EIP712_SAFE_TX_TYPE = {
            SafeTx: [
                { type: 'address', name: 'to' },
                { type: 'uint256', name: 'value' },
                { type: 'bytes', name: 'data' },
                { type: 'uint8', name: 'operation' },
                { type: 'uint256', name: 'safeTxGas' },
                { type: 'uint256', name: 'baseGas' },
                { type: 'uint256', name: 'gasPrice' },
                { type: 'address', name: 'gasToken' },
                { type: 'address', name: 'refundReceiver' },
                { type: 'uint256', name: 'nonce' },
            ],
        };
        this.buildSafeTx = (template) => {
            return {
                to: template.to,
                value: template.value || 0,
                data: template.data || '0x',
                operation: template.operation || 0,
                safeTxGas: template.safeTxGas || 0,
                baseGas: template.baseGas || 0,
                gasPrice: template.gasPrice || 0,
                gasToken: template.gasToken || AddressZero,
                refundReceiver: template.refundReceiver || AddressZero,
                nonce: template.nonce,
            };
        };
        /**
         *
         * @param baseTx SafeTransactionTemplate - The base transaction template to use for the signature
         */
        this.estimateSafeTx = async (baseTx) => {
            try {
                const result = await axios.post(`https://safe-relay.rinkeby.gnosis.io/api/v2/safes/${this.safeAddress}/transactions/estimate/`, baseTx);
                return result.data;
            }
            catch (err) {
                console.log(err);
            }
        };
        this.proposeTx = async (safeTx, safeTxHash, signature) => {
            try {
                const data = Object.assign(Object.assign({}, safeTx), { contractTransactionHash: safeTxHash, sender: signature.signer, signature: signature.data });
                const res = await axios.post(`https://safe-transaction.rinkeby.gnosis.io/api/v1/safes/${this.safeAddress}/multisig-transactions/`, data);
                return res.data;
            }
            catch (e) {
                console.log(e);
            }
        };
        /**
         *
         * @param chainId number - The chain ID of the Wallet
         * @param safeTx any - The SafeTransactionTemplate to use for the signature
         * @returns string - The transaction hash of the proposed transaction
         */
        this.getTransactionHash = (chainId, safeTx) => {
            const safeTxHash = ethers.utils._TypedDataEncoder.hash({
                chainId: chainId,
                verifyingContract: this.safeAddress,
            }, this.EIP712_SAFE_TX_TYPE, safeTx);
            return safeTxHash;
        };
        this.gnosisInit = async (safeAddress, receiverAddress, paymentValueInWei) => {
            try {
                this, (safeAddress = safeAddress);
                if (this.provider) {
                    const safeOwner = await this.provider.getSigner(0);
                    //Create Ethers Adapter
                    this.etherAdapter = new EthersAdapter({
                        ethers,
                        signer: safeOwner,
                    });
                    const safeSdk = await Safe.create({
                        ethAdapter: this.etherAdapter,
                        safeAddress: this.safeAddress,
                    });
                    const safeTx = this.buildSafeTx({
                        to: ethers.utils.getAddress(receiverAddress),
                        value: paymentValueInWei,
                        data: '0x',
                        operation: 0,
                        safeTxGas: 0,
                        nonce: 0,
                    });
                    //Step 1: Estimate SafeTx
                    const estimatedSafeTx = await this.estimateSafeTx(safeTx);
                    console.log(estimatedSafeTx);
                    safeTx.safeTxGas = estimatedSafeTx.safeTxGas;
                    safeTx.nonce =
                        estimatedSafeTx.lastUsedNonce === null
                            ? 0
                            : estimatedSafeTx.lastUsedNonce + 1;
                    //Step 2: get safetx hash
                    const safeTxHash = this.getTransactionHash(this.chainId, safeTx);
                    console.log(safeTxHash);
                    //Step 3: sign safeTxHash
                    const signature = await safeSdk.signTransactionHash(safeTxHash);
                    //Step 4: propose safeTx
                    const proposedSafeTx = await this.proposeTx(safeTx, safeTxHash, signature);
                    console.log(proposedSafeTx);
                    return proposedSafeTx;
                }
                else {
                    return null;
                }
            }
            catch (err) {
                console.log(err);
            }
        };
        this.provider = provider;
        this.chainId = chainId;
    }
}
