require('dotenv').config(); // Load environment variables from .env file

const { ethers } = require('ethers');
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core');
const { Pool, Route, Trade, SwapOptions, SwapRouter } = require('@uniswap/v3-sdk');
const {
  abi: IUniswapV3PoolABI,
} = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');

//  Replace these with your actual values
const BASE_CHAIN_RPC_URL = `https://mainnet.base.org`; // Your Base chain RPC URL (e.g., from Infura, Alchemy)
const PRIVATE_KEY = `My_key`
const WALLET_ADDRESS = `0xF0B3675AD44922B65306D01539986d7E78262968`
const TOKEN_OUT_ADDRESS = '0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3'; // Address of the token you want to swap FROM (e.g., USDC)
const TOKEN_IN_ADDRESS = '0x4200000000000000000000000000000000000006'; // Address of the token you want to swap TO (e.g., WETH)
const AMOUNT_IN = '1'; // Amount of the input token (e.g., '1' for 1 USDC)
const UNISWAP_V3_ROUTER_ADDRESS = '0xA7bdBE8Ba920B17d94B3d58Bf18B95f6F850B440'; // Uniswap V3 Router address on Base (Check Uniswap documentation for current address)
const POOL_FEE = 3000; // Pool fee (in hundredths of a percent, e.g., 0.3% is 3000)


    const provider = new ethers.JsonRpcProvider(BASE_CHAIN_RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);


async function getPool(tokenIn, tokenOut, fee) {
  const poolAddress = Pool.getAddress(tokenIn, tokenOut, fee);
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );

  const [token0, token1, slot0] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.slot0(),
  ]);

  const [reserve0, reserve1] =
    tokenIn.address.toLowerCase() === token0.toLowerCase()
      ? [slot0[0], slot0[1]]
      : [slot0[1], slot0[0]];


  return new Pool(
    tokenIn,
    tokenOut,
    fee,
    slot0[0],
    reserve0.toString(),
    reserve1.toString()
  );
}


async function swapTokens() {
    if (!BASE_CHAIN_RPC_URL || !PRIVATE_KEY || !WALLET_ADDRESS) {
        console.error('Error: Please set BASE_CHAIN_RPC_URL, PRIVATE_KEY and WALLET_ADDRESS in your .env file.');
        return;
    }

    try {
        // 1. Define Tokens
        const tokenIn = new Token(
            1, // Chain ID (Base is 8453)
            TOKEN_IN_ADDRESS,
            18, // Decimals (most tokens use 18, check your token's details)
            'TokenIn',
            'Token In' // You can customize names
        );

        const tokenOut = new Token(
            1, // Chain ID (Base is 8453)
            TOKEN_OUT_ADDRESS,
            18, // Decimals
            'WETH',
            'Wrapped Ether' // Customize if needed
        );


        // 2. Fetch Pool Information
        const pool = await getPool(tokenIn, tokenOut, POOL_FEE);


        // 3. Create Trade
        const amountIn = CurrencyAmount.fromRawAmount(tokenIn, ethers.parseUnits(AMOUNT_IN, tokenIn.decimals).toString());

        const route = new Route([pool], tokenIn, tokenOut);
        const trade = new Trade({
            route: route,
            amountIn: amountIn,
            tradeType: TradeType.EXACT_INPUT,
            slippageTolerance: new Percent(50, 10_000), // 0.5% slippage
        });


        // 4. Generate Swap Transaction
        const swapOptions = {
            slippageTolerance: new Percent(50, 10_000), //  0.5% slippage
            deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
        };
        const methodParameters = SwapRouter.swapCallParameters(trade, swapOptions);


        // 5. Build Transaction
        const transactionRequest = {
            data: methodParameters.calldata,
            to: UNISWAP_V3_ROUTER_ADDRESS,
            value: methodParameters.value,
            from: WALLET_ADDRESS,
            gasLimit: 500000, // Adjust gas limit as needed
        };

        // 6. Sign and Send Transaction
        const tx = await signer.sendTransaction(transactionRequest);
        console.log('Swap Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Swap Transaction confirmed:', receipt.transactionHash);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`Transaction cost: ${ethers.formatEther(receipt.fee)} ETH`);

    } catch (error) {
        console.error('Swap failed:', error);
    }
}


swapTokens();