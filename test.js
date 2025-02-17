const axios = require('axios');
const ethers = require("ethers");



const BASE_RPC1 = `https://mainnet.base.org`;
let provider = new ethers.JsonRpcProvider(BASE_RPC1);

async function getWhaleTransactionsBase(walletAddress, limit = 1, apiKey = `B2G633IPG9EXWX2G67BM1RE9J6BB2NEX2P`) {
    if (!walletAddress) {
        throw new Error("Wallet address is required.");
    }

    if (!apiKey) {
        throw new Error("Etherscan API key is required. Please set ETHERSCAN_API_KEY in your .env file or pass it as an argument.");
    }

    if (limit <= 0 || limit > 10000) {  // Etherscan's maximum limit per request.
        limit = 10; //  Sensible default
        console.warn("Limit must be between 1 and 10000. Using default limit of 10.");
    }

    const baseUrl = 'https://api.basescan.org/api'; // Use the Basescan API endpoint

    try {
        const response = await axios.get(baseUrl, {
            params: {
                module: 'account',
                action: 'txlist',
                address: walletAddress,
                startblock: 0,  // Fetch from the beginning (adjust for faster queries if needed)
                endblock: 99999999, // Use a very large number to fetch to the most recent block
                sort: 'desc',  // Sort by most recent transaction first
                offset: limit,
                page: 1,  // Start from page 1 (not page 0 which is invalid)
                apikey: apiKey,
            },
        });

        if (response.data && response.data.status === '1') {
            return response.data.result; // Return the transaction data
        } else if (response.data && response.data.message === 'NOTOK') {
            console.error(`Etherscan API error: ${response.data.result}`);
            return [];  // Return empty array on error
        } else {
            console.error('Unexpected API response:', response.data);
            return [];  // Return empty array on unexpected response
        }

    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API request failed:', error.response.status, error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('API request failed: No response received', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('API request failed:', error.message);
        }
        return []; // Return empty array on any error
    }
}

// Example usage (replace with your whale wallet address)
async function exampleUsage() {
    const whaleWalletAddress = '0xF0B3675AD44922B65306D01539986d7E78262968'; // Replace with a valid whale address on Base
    try {
        const uniswapRouterAddress = `0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24`


        const uniswapRouterABI = [
            "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)",
            "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)",
            "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)",
            "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)",
            "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)",
            "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)"
        ];

        const uniswapRouterContract = new ethers.Contract(uniswapRouterAddress, uniswapRouterABI, provider);



        const allTransactions = await getWhaleTransactionsBase(whaleWalletAddress, 20);  // Get the 20 most recent allTransactions
        if (allTransactions.length > 0) {
            const swapDetails = [];

            if (allTransactions[0].to && allTransactions[0].to.toLowerCase() === uniswapRouterAddress.toLowerCase() && allTransactions[0].input) {
                try {
                    const decodedInput = await uniswapRouterContract.interface.parseTransaction({ data: allTransactions[0].input });

                    if (decodedInput) {
                        const functionName = decodedInput.name;
                        const args = decodedInput.args;
                        let sendToken, receiveToken, amountIn, amountOutMin, amountOut, isEthIn = false, isEthOut = false;

                        // Determine the swap details based on the function called
                        if (functionName === 'swapExactETHForTokens') {
                            isEthIn = true;
                            amountOutMin = args[0];
                            const path = args[1]; // Array of token addresses
                            receiveToken = path[1];
                            sendToken = path[0];  // Since ETH is being sent
                        } else if (functionName === 'swapExactTokensForETH') {
                            amountIn = args[0];
                            amountOutMin = args[1];
                            const path = args[2];
                            sendToken = path[0];
                            receiveToken = path[1]; // ETH is being received
                        } else if (functionName === 'swapExactTokensForTokens') {
                            amountIn = args[0];
                            amountOutMin = args[1];
                            const path = args[2];
                            sendToken = path[0];
                            receiveToken = path[path.length - 1];
                        } else if (functionName === 'swapETHForExactTokens') {
                            isEthIn = true;
                            amountOut = args[0];
                            const path = args[1];
                            receiveToken = path[path.length - 1];
                            sendToken = path[0];
                        } else if (functionName === 'swapTokensForExactETH') {
                            amountOut = args[0];
                            amountIn = args[1];
                            const path = args[2];
                            sendToken = path[0];
                            receiveToken = path[1];
                        } else if (functionName === 'swapTokensForExactTokens') {
                            amountOut = args[0];
                            amountIn = args[1];
                            const path = args[2];
                            sendToken = path[0];
                            receiveToken = path[path.length - 1];
                        }

                        if (sendToken || receiveToken) { // Only add if we could identify tokens
                            swapDetails.push({
                                hash: allTransactions[0].hash,
                                timestamp: new Date(parseInt(allTransactions[0].timeStamp, 10) * 1000).toLocaleString(),
                                functionName,
                                sendToken,
                                receiveToken,
                                amountIn,
                                amountOutMin,
                                amountOut,
                                isEthIn,
                                isEthOut,
                                // Add any other relevant transaction details here
                            });
                        }
                    }
                } catch (decodeError) {
                    console.warn(`Error decoding input data for transaction ${allTransactions[0].hash}:`, decodeError);
                    // Continue processing other transactions
                }
            }

            return swapDetails;

        } else {
            console.log(`No transactions found for whale wallet ${whaleWalletAddress}.`);
        }
    } catch (error) {
        console.error('Error getting transactions:', error.message);
    }
}

// Run the example (only if this is the main module)
(async () => {

    const finallyResult = await exampleUsage();
    console.log(finallyResult);

}
)()

module.exports = { getWhaleTransactionsBase }; // Export the function for use in other modules