const { ethers } = require('ethers'); //  Recommended for its ease of use

// const BASE_RPC_URL =`https://base-sepolia.g.alchemy.com/v2/vpGBAGqJtoZ1JYzUBUDEYI0rFAma5per`
const BASE_RPC_URL = "https://mainnet.base.org"; // Base Mainnet. Get a proper one from Infura/Alchemy
const WALLET_PRIVATE_KEY = "0x0fcb3f266f4a8dff1c98c689bc7e84de17529534b9129dbce236ecafa5c59767"; //  **NEVER HARDCODE THIS IN PRODUCTION!** Use environment variables or secure storage.
const OUTPUT_TOKEN_ADDRESS = "0x4200000000000000000000000000000000000006";  // ETH on Base (This is the "wrapped" ETH address, which is required by Uniswap).
const INPUT_TOKEN_ADDRESS = "0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3"; // Your specific token address
const UNISWAP_ROUTER_ADDRESS = "0xF0B3675AD44922B65306D01539986d7E78262968";  // Router address for Base. (Check for the latest on Uniswap docs).
const FEE_TIER = 3000; //  Fee tier for the pool (e.g., 3000 for 0.3%, 10000 for 1%). Check Uniswap docs for values.
const SLIPPAGE_TOLERANCE = 0.005; // 0.5% slippage (as a decimal, e.g., 0.005)

const { AlphaRouter, SwapRouter, } = require('@uniswap/smart-order-router');
const { Token, CurrencyAmount, TradeType, Percent, } = require('@uniswap/v3-sdk');

// Constants
const WETH_ADDRESS = "0xb4fbf271143f4e5e9f7575c7a9019f79277f99e5"; // Wrapped ETH on Base
const CHAIN_ID = 8453; // Base Chain ID
const TOKEN_ADDRESS = "0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3"; // Your token address
const SWAP_AMOUNT_ETH = 0.0002; // Amount of ETH to swap
const SLIPPAGE_PERCENT = 0.5; // Slippage tolerance (0.5%)

async function swapEthForToken() {
    try {
        // 1. Provider and Signer Setup

        // Use an Infura or Alchemy API key for a reliable connection.  Replace with your actual API key if using.
        const provider = new ethers.providers.JsonRpcProvider(process.env.BASE_RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);  // Replace with your private key
        const router = new AlphaRouter({ chainId: CHAIN_ID, provider: provider });


        // 2. Token Instances

        // ETH
        const WETH = new Token(CHAIN_ID, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether'); // Use wrapped ETH since Uniswap deals with it
        // Your token
        const TOKEN = new Token(CHAIN_ID, TOKEN_ADDRESS, 18); // Assuming 18 decimals.  Adjust if needed.

        // 3. Construct Trade
        const ethAmount = CurrencyAmount.fromRawAmount(WETH, ethers.utils.parseEther(SWAP_AMOUNT_ETH.toString()).toString()); // Convert ETH amount to BigNumber

        const route = await router.route(
            {
                amount: ethAmount,
                tokenFrom: WETH,
                tokenTo: TOKEN,
                type: TradeType.EXACT_INPUT, // We're providing a specific amount of ETH
                recipient: wallet.address, // Where the tokens will be sent
                slippageTolerance: new Percent(SLIPPAGE_PERCENT * 100, 10000), // 0.5% slippage
            },
            {
                maxSplits: 3, // Consider reducing this if your routes are getting too complex (e.g., long-chain swaps)
            }
        );


        if (!route) {
            console.log("No route found for the swap.");
            return;
        }
        console.log("Quote:", route.quote);
        console.log("Route: ", route.route);

        // 4. Prepare Transaction Parameters

        const transaction = {
            data: route.methodParameters.calldata,
            to: SwapRouter.ADDRESS(CHAIN_ID),
            value: ethers.utils.parseEther(SWAP_AMOUNT_ETH.toString()), // Send ETH as value
            from: wallet.address,
            gasPrice: route.gasPriceWei,
            gasLimit: ethers.BigNumber.from(route.estimatedGasUsed.toString()), // Estimate gas used
        };

        // 5. Sign and Execute the Transaction

        const receipt = await wallet.sendTransaction(transaction);
        console.log("Transaction sent:", receipt.hash);

        const swapReceipt = await receipt.wait();
        console.log("Swap successful:", swapReceipt.transactionHash);

    } catch (error) {
        console.error("Swap failed:", error);
    }
}

// Run the swap function
swapEthForToken();