const { ethers } = require("ethers");
const { TradeType, Token, CurrencyAmount, Percent } = require("@uniswap/sdk-core");
const { Pool, Route, Trade, SwapRouter } = require("@uniswap/v3-sdk");

// --- Configuration ---
const RPC_URL = "https://mainnet.base.org"; // Base Mainnet RPC
const PRIVATE_KEY = `0x0fcb3f266f4a8dff1c98c689bc7e84de17529534b9129dbce236ecafa5c59767`;
const WALLET_ADDRESS = "0xF0B3675AD44922B65306D01539986d7E78262968"; // Replace with your wallet address

// --- Token Addresses ---
const ETH_ADDRESS = "0x4200000000000000000000000000000000000006"; // WETH on Base
const CUSTOM_TOKEN_ADDRESS = "0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3";

// --- Token Config ---
const ETH = new Token(8453, ETH_ADDRESS, 18, "ETH", "Ether");
const CUSTOM_TOKEN = new Token(8453, CUSTOM_TOKEN_ADDRESS, 18, "CUSTOM", "Your Token");

console.log(`ETH ====🚀`, ETH);
console.log(`CUSTOM_TOKEN ====🚀`, CUSTOM_TOKEN);

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);


const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Base Mainnet Uniswap V3 Factory
const factoryABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)"
];

const FEE_TIER = 3000; // 0.3% Fee Tier (Check different tiers if needed)

async function main() {
    const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, provider);
    const poolAddress = await factory.getPool(ETH_ADDRESS, CUSTOM_TOKEN_ADDRESS, FEE_TIER);

    console.log(`poolAddress ====🚀`, poolAddress);

    if (poolAddress === ethers.ZeroAddress) {
        console.log("No Uniswap V3 pool found for ETH → Your Token at 0.3% fee.");
    } else {
        console.log(`Uniswap V3 Pool Address: ${poolAddress}`);
    }

    const poolContract = new ethers.Contract(
        poolAddress,
        [
            "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
            "function liquidity() view returns (uint128)"
        ],
        provider
    );

    const [sqrtPriceX96, tick] = await poolContract.slot0();
    console.log(`sqrtPriceX96 ====🚀`, JSON.stringify(sqrtPriceX96));
    const liquidity = await poolContract.liquidity();

    // --- Create Uniswap Pool ---
    const pool = new Pool(ETH, CUSTOM_TOKEN, 3000, sqrtPriceX96, liquidity, tick);

    // --- Create Route & Trade ---
    const route = new Route([pool], ETH, CUSTOM_TOKEN);
    const trade = await Trade.fromRoute(route, CurrencyAmount.fromRawAmount(ETH, ethers.parseUnits("0.0002", 18)), TradeType.EXACT_INPUT);

    // --- Get Minimum Output with Slippage ---
    const slippageTolerance = new Percent(50, 10_000); // 0.50% Slippage
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).toExact();

    console.log(`Minimum ${CUSTOM_TOKEN.symbol} Expected: ${amountOutMin}`);

    // --- Encode Swap Transaction ---
    const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap V3 Router on Base
    const swapRouter = new ethers.Contract(swapRouterAddress, [
        "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external payable returns (uint256)"
    ], wallet);

    const params = {
        tokenIn: ETH_ADDRESS,
        tokenOut: CUSTOM_TOKEN_ADDRESS,
        fee: 3000, // 0.3% Fee Tier
        recipient: WALLET_ADDRESS,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes deadline
        amountIn: ethers.parseUnits("0.0003", 18), // Swap 0.0003 ETH
        amountOutMinimum: ethers.parseUnits(amountOutMin, 18),
        sqrtPriceLimitX96: 0 // No price limit
    };

    // --- Send Swap Transaction ---
    const tx = await swapRouter.exactInputSingle(params, { value: ethers.parseUnits("0.0002", 18), gasLimit: 300000 });
    console.log(`Transaction Hash: ${tx.hash}`);

    // --- Wait for Transaction to Confirm ---
    const receipt = await tx.wait();
    console.log("Swap Successful! Transaction Receipt:", receipt);
}

main().catch(console.error);
