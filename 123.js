require('dotenv').config(); // Load environment variables from .env (optional, but recommended)
const ethers = require('ethers');

// --- Configuration ---
const BASE_RPC_URL = `https://mainnet.base.org` // Replace with your Base RPC URL
const PRIVATE_KEY = `0x0fcb3f266f4a8dff1c98c689bc7e84de17529534b9129dbce236ecafa5c59767`;  // Replace with your private key (NEVER commit this to public repos!)
const TOKEN_ADDRESS = "0x7a5f5ccd46ebd7ac30615836d988ca3bd57412b3"; // Replace with the token you want to buy
const AMOUNT_ETH_TO_SPEND = 0.0005; //  Amount of ETH you want to spend on the token
const GAS_LIMIT = 500000; // Adjust gas limit if necessary.  Start with a generous amount
const GAS_PRICE_GWEI = 0.0001; //  Adjust gas price in Gwei.  Check current network conditions
const UNISWAP_V2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router on Base
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"; // Wrapped ETH on Base (Uniswap uses WETH)  use this in the path as it's eth, not weth

async function main() {
    if (!BASE_RPC_URL || BASE_RPC_URL === 'YOUR_BASE_RPC_URL') {
        console.error('Error: BASE_RPC_URL not configured.  Set it in .env or directly in the code.');
        return;
    }

    if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY') {
        console.error('Error: PRIVATE_KEY not configured.  Set it in .env or directly in the code.');
        return;
    }


    try {
        // --- Initialize Provider and Wallet ---
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log(`Using wallet address: ${wallet.address}`);
        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`Wallet ETH balance: ${balanceEth} ETH`);

        if (parseFloat(balanceEth) < AMOUNT_ETH_TO_SPEND + 0.0001) {  // Add a buffer for gas
            console.error(`Insufficient ETH balance.  Need at least ${AMOUNT_ETH_TO_SPEND + 0.0001} ETH,  have ${balanceEth}`);
            return;
        }

        const tokenABI = [
            // ERC-20 standard functions
            "function decimals() external view returns (uint8)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)",
            "function transfer(address recipient, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) external view returns (uint256)",
        ];

        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider); // Use provider, not wallet, for read-only operations
       
        
        // --- Uniswap Router ABI ---
        const uniswapRouterABI = [
          "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
          "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
        ];


        const uniswapRouterContract = new ethers.Contract(UNISWAP_V2_ROUTER_ADDRESS, uniswapRouterABI, wallet);
        const path = [WETH_ADDRESS, TOKEN_ADDRESS];
        
        const slippagePercentage = 0.5; // 1% slippage.  Adjust as needed
        const ethAmount = ethers.parseEther(AMOUNT_ETH_TO_SPEND.toString());
        
        let amountOutMin;

        try {
            let amounts;
            try {
                amounts = await uniswapRouterContract.getAmountsOut(ethAmount, path);
            } catch (error) {
                console.error("Error fetching amounts out:", error);
                console.error("Possible reasons:");
                console.error("1. Incorrect token address.");
                console.error("2. Token not supported by Uniswap.");
                console.error("3. Incorrect path.");
                throw new Error("Failed to fetch amounts out. Please check the token address and ensure it is supported by Uniswap.");
            }
            const amountOut = amounts[1]; // The second amount in the return is the token amount
            
            const decimals = await tokenContract.decimals(); // Get the number of decimals
            const slippageAmount = amountOut * slippagePercentage;
            amountOutMin = amountOut - slippageAmount;

            console.log(`Estimated tokens out: ${ethers.formatUnits(amountOut, decimals)}`);
            console.log(`Amount out min (with ${slippagePercentage * 100}% slippage): ${ethers.formatUnits(amountOutMin, decimals)}`);

        } catch (error) {
           console.error("Error estimating token output:", error);
           console.error("Likely problems:");
           console.error("1.  Uniswap might not support this token.");
           console.error("2.  Need to add more dependencies");
           return;
        }

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

        const tx = await uniswapRouterContract.swapExactETHForTokens(
            amountOutMin,
            path,
            wallet.address,
            deadline,
            {
                value: ethAmount,
                gasLimit: GAS_LIMIT,
                gasPrice: ethers.parseUnits(GAS_PRICE_GWEI.toString(), "gwei")
            }
        );

        console.log("Transaction initiated.  Waiting for confirmation...");
        console.log(`Transaction hash: ${tx.hash}`);

        // --- Wait for Transaction Confirmation ---
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            console.log("Transaction confirmed!");
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`Transaction receipt: ${JSON.stringify(receipt, null, 2)}`); // Detailed receipt
        } else {
            console.error("Transaction failed.");
            console.error(`Transaction receipt: ${JSON.stringify(receipt, null, 2)}`); // Detailed receipt
        }

    } catch (error) {
        console.error("An error occurred:", error);
    }
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });