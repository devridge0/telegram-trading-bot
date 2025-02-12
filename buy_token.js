const { ethers }  = require( 'ethers'); //  Recommended for its ease of use

// const BASE_RPC_URL =`https://base-sepolia.g.alchemy.com/v2/vpGBAGqJtoZ1JYzUBUDEYI0rFAma5per`
const BASE_RPC_URL = "https://mainnet.base.org"; // Base Mainnet. Get a proper one from Infura/Alchemy
const WALLET_PRIVATE_KEY = "0x0fcb3f266f4a8dff1c98c689bc7e84de17529534b9129dbce236ecafa5c59767"; //  **NEVER HARDCODE THIS IN PRODUCTION!** Use environment variables or secure storage.
const OUTPUT_TOKEN_ADDRESS = "0x4200000000000000000000000000000000000006";  // ETH on Base (This is the "wrapped" ETH address, which is required by Uniswap).
const INPUT_TOKEN_ADDRESS = "0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3"; // Your specific token address
const UNISWAP_ROUTER_ADDRESS = "0xF0B3675AD44922B65306D01539986d7E78262968";  // Router address for Base. (Check for the latest on Uniswap docs).
const FEE_TIER = 3000; //  Fee tier for the pool (e.g., 3000 for 0.3%, 10000 for 1%). Check Uniswap docs for values.
const SLIPPAGE_TOLERANCE = 0.005; // 0.5% slippage (as a decimal, e.g., 0.005)


const FACTORY_ABI = require( './abis/factory.json' );
const QUOTER_ABI = require( './abis/quoter.json' );
const SWAP_ROUTER_ABI = require( './abis/swaprouter.json' );
const POOL_ABI = require( './abis/pool.json' );
const TOKEN_IN_ABI = require( './abis/weth.json' );

// Deployment Addresses
const POOL_FACTORY_CONTRACT_ADDRESS = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c'
const QUOTER_CONTRACT_ADDRESS = '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'
const SWAP_ROUTER_CONTRACT_ADDRESS = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'

// Provider, Contract & Signer Instances
const provider = new ethers.JsonRpcProvider(BASE_RPC_URL)
const factoryContract = new ethers.Contract(POOL_FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, provider);
const quoterContract = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, QUOTER_ABI, provider)
const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider)


const WETH = {
    chainId: 11155111,
    address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    isToken: true,
    isNative: true,
    wrapped: true
  }
  
const USDC = {
    chainId: 11155111,
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD//C',
    isToken: true,
    isNative: true,
    wrapped: false
}


async function approveToken(tokenAddress, tokenABI, amount, wallet) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);

        const approveTransaction = await tokenContract.approve.populateTransaction(
            SWAP_ROUTER_CONTRACT_ADDRESS,
            ethers.parseEther(amount.toString())
        );

        const transactionResponse = await wallet.sendTransaction(approveTransaction);
        console.log(`-------------------------------`)
        console.log(`Sending Approval Transaction...`)
        console.log(`-------------------------------`)
        console.log(`Transaction Sent: ${transactionResponse.hash}`)
        console.log(`-------------------------------`)
        const receipt = await transactionResponse.wait();
        console.log(`Approval Transaction Confirmed! https://sepolia.etherscan.io/txn/${receipt.hash}`);
    } catch (error) {
        console.error("An error occurred during token approval:", error);
        throw new Error("Token approval failed");
    }
}


async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
    const poolAddress = await factoryContract.getPool(tokenIn.address, tokenOut.address, 3000);
    console.log(`poolAddress ________________ ${poolAddress}`)

    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);

    if (!poolAddress) {
        throw new Error("Failed to get pool address");
    }
    const [token0, token1, fee] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
    ]);
    return { poolContract, token0, token1, fee };
}

async function quoteAndLogSwap(quoterContract, fee, signer, amountIn) {
    const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall({
        tokenIn: WETH.address,
        tokenOut: USDC.address,
        fee: fee,
        recipient: signer.address,
        deadline: Math.floor(new Date().getTime() / 1000 + 60 * 10),
        amountIn: amountIn,
        sqrtPriceLimitX96: 0,
    });
    console.log(`-------------------------------`)
    console.log(`Token Swap will result in: ${ethers.formatUnits(quotedAmountOut[0].toString(), USDC.decimals)} ${USDC.symbol} for ${ethers.formatEther(amountIn)} ${WETH.symbol}`);
    const amountOut = ethers.formatUnits(quotedAmountOut[0], USDC.decimals)
    return amountOut;
}

async function prepareSwapParams(poolContract, signer, amountIn, amountOut) {
    return {
        tokenIn: WETH.address,
        tokenOut: USDC.address,
        fee: await poolContract.fee(),
        recipient: signer.address,
        amountIn: amountIn,
        amountOutMinimum: amountOut,
        sqrtPriceLimitX96: 0,
    };
}

async function executeSwap(swapRouter, params, signer) {
    const transaction = await swapRouter.exactInputSingle.populateTransaction(params);
    const receipt = await signer.sendTransaction(transaction);
    console.log(`-------------------------------`)
    console.log(`Receipt: https://sepolia.etherscan.io/tx/${receipt.hash}`);
    console.log(`-------------------------------`)
}

async function main(swapAmount) {
    const inputAmount = swapAmount
    const amountIn = ethers.parseUnits(inputAmount.toString(), 18);

    try {
        // await approveToken(WETH.address, TOKEN_IN_ABI, amountIn, signer)
        const { poolContract, token0, token1, fee } = await getPoolInfo(factoryContract, WETH, USDC);
        console.log(`-------------------------------`);
        console.log(`Fetching Quote for: ${WETH.symbol} to ${USDC.symbol}`);
        console.log(`-------------------------------`);
        console.log(`Swap Amount: ${ethers.formatEther(amountIn)}`);

        const quotedAmountOut = await quoteAndLogSwap(quoterContract, fee, signer, amountIn);

        const params = await prepareSwapParams(poolContract, signer, amountIn, quotedAmountOut[0].toString());
        const swapRouter = new ethers.Contract(SWAP_ROUTER_CONTRACT_ADDRESS, SWAP_ROUTER_ABI, signer);
        // await executeSwap(swapRouter, params, signer);
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

main(0.00001) // Change amount as needed