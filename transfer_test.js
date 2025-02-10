const { ethers } = require('ethers');
// const { Token, CurrencyAmount, TradeType, Percent, Router, SwapType, Pool } = require('@uniswap/v3-sdk'); // Import necessary modules from uniswap-v3-sdk

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Wrapped ETH on Base (ETH for Base)
// const ROUTER_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with the correct Uniswap V3 Router address on Base.
const ROUTER_ADDRESS = '0xF0B3675AD44922B65306D01539986d7E78262968'; // Replace with the correct Uniswap V3 Router address on Base.
const FEE_TIER = 3000; // 0.3% fee tier -  MUST MATCH THE POOL FEE YOU'RE USING
const providerRpcUrl = `https://mainnet.base.org`
const privateKey = `0x0fcb3f266f4a8dff1c98c689bc7e84de17529534b9129dbce236ecafa5c59767`; // Replace with your wallet's private key in .env file
const recipientAddress = `0xF0B3675AD44922B65306D01539986d7E78262968`; // Replace with the address to receive the purchased tokens
const chainId = 8453; // Base chain ID
const tradeSlippage = 50; // 0.5% slippage tolerance - Adjust as needed

const tokenToBuyAddress = '0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3'; // The token you want to buy
const ethAmountToSpend = 0.0002; // Amount of ETH you want to spend to buy the token
async function buyTokenWithEth() {
  try {
    if (!providerRpcUrl || !privateKey ) {
      throw new Error('Missing required environment variables. Check your .env file.');
    }

    const provider = new ethers.JsonRpcProvider(providerRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const router = new ethers.Contract(ROUTER_ADDRESS, [
      "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)"
    ], wallet);

    const tokenToBuyContract = new ethers.Contract(tokenToBuyAddress, ["function decimals() view returns (uint8)", "function symbol() view returns (string)"], provider);

    const decimalsToBuy = await tokenToBuyContract.decimals();
    const symbolToBuy = await tokenToBuyContract.symbol();

      const ethAmountInWei = ethers.parseUnits(ethAmountToSpend.toString(), 18); // Convert ETH to Wei
      // For ETH -> Token swaps, tokenIn is WETH and amountIn is ETH in wei
      const params = {
          tokenIn: WETH_ADDRESS,
          tokenOut: tokenToBuyAddress,
          fee: FEE_TIER, // This *must* correspond to the fee tier of the pool you're interacting with.
          recipient: recipientAddress,
          amountIn: ethAmountInWei,
          amountOutMinimum: 0, // Set to 0, avoids errors
          sqrtPriceLimitX96: 0,  // Set to 0, avoids errors
      };

      const tx = await router.exactInputSingle(params, {
          gasLimit: 3000000, // Set a reasonable gas limit
          value: ethAmountInWei, // Send ETH as value since we are buying with ETH
      });

    console.log('Transaction sent: ', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed: ', receipt.transactionHash);
    console.log('Token purchase successful!');

  } catch (error) {
    console.error('Error buying token:', error);
  }
}

// --- Example Usage ---
buyTokenWithEth();