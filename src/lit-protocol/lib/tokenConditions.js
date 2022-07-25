/**
 * For ERC20 token gating
 * @param tokenAddress The address of the token to be used in the condition.
 * @param chain The chain of the token to be used in the condition.
 * @returns
 */
export const getERC20TokenGating = (tokenAddress, chain) => {
    const accessControlConditions = [
        {
            contractAddress: tokenAddress,
            standardContractType: 'ERC20',
            chain,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
                comparator: '>',
                value: '0',
            },
        },
    ];
    return accessControlConditions;
};
export const getERC721TokenGating = (tokenAddress, chain, tokenId) => {
    if (tokenId) {
        const accessControlConditions = [
            {
                contractAddress: tokenAddress,
                standardContractType: 'ERC721',
                chain,
                method: 'ownerOf',
                parameters: [tokenId],
                returnValueTest: {
                    comparator: '=',
                    value: ':userAddress',
                },
            },
        ];
        return accessControlConditions;
    }
    const accessControlConditions = [
        {
            contractAddress: tokenAddress,
            standardContractType: 'ERC721',
            chain,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
                comparator: '>',
                value: '0',
            },
        },
    ];
    return accessControlConditions;
};
export const getERC1155TokenGating = (tokenAddress, chain, tokenId) => {
    if (tokenId) {
        const accessControlConditions = [
            {
                contractAddress: tokenAddress,
                standardContractType: 'ERC1155',
                chain,
                method: 'balanceOf',
                parameters: [':userAddress', tokenId],
                returnValueTest: {
                    comparator: '>',
                    value: '0',
                },
            },
        ];
        return accessControlConditions;
    }
    const accessControlConditions = [
        {
            contractAddress: tokenAddress,
            standardContractType: 'ERC1155',
            chain,
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
                comparator: '>',
                value: '0',
            },
        },
    ];
    return accessControlConditions;
};
