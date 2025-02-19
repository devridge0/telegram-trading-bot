const bs58 = require('bs58');
const fetch = require('cross-fetch')
const chalk = require('chalk');
const dotenv = require('dotenv');
const { ethers, ZeroAddress } = require("ethers");
const BN = require('bn.js');
dotenv.config();

let newSignList = [];

const Red = (str) => console.log(chalk.bgRed(`${str}\n`));
const Yellow = (str) => console.log(chalk.bgYellow(`${str}\n`));
const Blue = (str) => console.log(chalk.bgBlue(`${str}\n`));
const Green = (str) => console.log(chalk.bgGreen(`${str}\n`));
const White = (str) => console.log(chalk.bgWhite(`${str}\n`));


const DEX_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" // Wrapped ETH


// -----------------------------------           ABI                 ----------------------------------------
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;


const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint)",
    "function decimals() view returns (uint8)",
];

const UNISWAP_PAIR_ABI = [
    "function getReserves() view returns (uint112, uint112, uint32)",
    "function token0() view returns (address)",
];

const ERC20_ABI_APPROVE = [
    "function approve(address spender, uint256 amount) returns (bool)",
];

const UNISWAP_ROUTER_ABI111 = [
    // Swap Exact Tokens For Tokens
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",

    // Swap Exact ETH For Tokens (when swapping ETH)
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",

    // Get Amounts Out
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];


const UNISWAP_ROUTER_ABI = [
    // Swap Exact Tokens For Tokens
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",

    // Swap Exact Tokens For ETH
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",

    // Swap Exact ETH For Tokens (when swapping ETH)
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",

    // Get Amounts Out
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];
//-----------------------------------------------------------------------------------------------------------------------


const BASE_RPC = `https://base-sepolia.g.alchemy.com/v2/4XJ2-1bwaIzXLGsmYF-bGcQVp7GaFrgR`;
const BASE_RPC1 = `https://mainnet.base.org`;
let provider = new ethers.JsonRpcProvider(BASE_RPC1);

const BaseNetwork = {
    createBaseWalletETH: async () => {
        try {
            const randomBytes = ethers.randomBytes(32);
            const privateKey = ethers.hexlify(randomBytes);
            const wallet = new ethers.Wallet(privateKey);
            const publicKey = wallet.address;

            return { publicKey, privateKey };
        } catch (error) {
            Red(`createBaseWalletETH ====🚀${error}`);
        }
    },

    getBaseWalletBalance: async (publicKey) => {
        try {
            const balance = await provider.getBalance(publicKey);
            return ethers.formatEther(balance); // Convert Wei to ETH
        } catch (error) {
            Red(`getBaseWalletBalance ====🚀${error}`);
        }
    },

    isValidBasePrivateKey: async (privateKey) => {
        if (typeof privateKey !== 'string') {
            return false; // Not a string
        }

        if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
            return false; // Does not match hex format
        }

        try {
            new ethers.Wallet(privateKey);
            return true; // Valid private key
        }
        catch (e) {
            Red(`isValidBasePrivateKey ====🚀${e}`);

            return false; //Not a valid private key
        }
    },

    getBasePublicKeyFromPrivateKey: async (privateKey) => {
        try {
            const wallet = new ethers.Wallet(privateKey);
            const publicKey = wallet.address;
            return publicKey;
        } catch (error) {
            Red(`getBasePublicKeyFromPrivateKey ====🚀${error}`);
            return null; // Or throw an error, depending on how you want to handle failures
        }
    },

    isValidBasePublicKey: async (publicKey) => {
        try {
            if (typeof publicKey !== 'string' || publicKey.length != 42) {
                return false; // Not a string
            }
            else return true;
        } catch (error) {
            Red(`getBasePublicKeyFromPrivateKey ====🚀${error}`);
            return false;
        }
    },


    isValidBaseTokenMintAddress: async (address) => {
        try {
            if (typeof address !== 'string') {
                return false; // Not a string
            }
            if (!ethers.isAddress(address)) {
                return false; // Invalid address format
            }

            const contract = new ethers.Contract(address, ERC20_ABI, provider);
            // Attempt to call basic ERC-20 functions
            await contract.name();
            await contract.symbol();
            await contract.decimals();
            await contract.totalSupply();

            return true; // All required functions are available

        } catch (error) {
            console.error("Error validating token mint address:", error);
            return false; // Required functions are missing or an error occurred
        }
    },


    transferAllEth: async (privateKey, receiverAddress) => {
        try {
            const wallet = new ethers.Wallet(privateKey, provider);
            const balance = await provider.getBalance(wallet.address);
            if (balance - BigInt(129960928660572) <= 0) {
                return false;
            }
            const amountToSend = ethers.formatEther(balance - BigInt(129960928660572));

            const tx = {
                to: receiverAddress,
                value: ethers.parseEther(amountToSend)
            }

            const txResponse = await wallet.sendTransaction(tx);
            const txReceipt = await txResponse.wait(); // Wait for confirmation
            console.log(`Transaction hash: https://basescan.org/tx/${txReceipt.hash}`);
            return txReceipt.hash;
        } catch (error) {
            console.error("Error transferring ETH:", error);
            return null; // Return null if an error occurred
        }
    },

    transferCustomerAmountEth: async (privateKey, receiverAddress, amount) => {
        try {
            const wallet = new ethers.Wallet(privateKey, provider);
            const balance = await provider.getBalance(wallet.address);
            console.log(`amount ====🚀`, amount);

            const amountToSend = balance * BigInt(Math.floor(amount * 1e18)) / BigInt(1e18);
            console.log(`amountToSend ====🚀`, amountToSend);

            if (amountToSend <= 0) {
                return false;
            }

            const tx = {
                to: receiverAddress,
                value: amountToSend
            };

            const txResponse = await wallet.sendTransaction(tx);
            const txReceipt = await txResponse.wait(); // Wait for confirmation
            console.log(`Transaction hash: https://basescan.org/tx/${txReceipt.hash}`);
            return txReceipt.hash;

        } catch (error) {
            console.error("Error sending transaction:", error);
            throw error;
        }
    },

    getBaseTokenInWalletETH: async (walletAddress) => {
        try {

            const apiUrl = `https://api.basescan.org/api?module=account&action=tokenbalance&address=${walletAddress}&tag=latest&apikey=${process.env.BASE_API_KEY}`;
            White(apiUrl)

            const response = await fetch(apiUrl);
            Blue(JSON.stringify(response))
            if (response.data.status === '1') {
                const tokenBalances = response.data.result;
                const parsedBalances = await Promise.all(tokenBalances.map(async (token) => {
                    try {
                        const contract = new ethers.Contract(token.contractAddress, ['function decimals() view returns (uint8)'], provider)
                        const decimals = await contract.decimals()
                        const balance = ethers.formatUnits(token.balance, decimals)
                        return {
                            contractAddress: token.contractAddress,
                            name: token.tokenName,
                            symbol: token.tokenSymbol,
                            balance: balance
                        }
                    }
                    catch (error) {
                        console.error(`Error getting token info for ${token.contractAddress}: ${error}`);
                        return {
                            contractAddress: token.contractAddress,
                            error: "Error getting token info"
                        };
                    }
                }));


                return parsedBalances;
            }
            else {
                throw new Error(`Could not get token balances for address ${walletAddress}: ${response.data.message}`)
            }


        } catch (error) {
            console.error("Error fetching token balances:", error);
            throw error;
        }
    },


    buyTokenETH: async (privateKey, tokenOut, amountIn) => {
        try {

            const wallet = new ethers.Wallet(privateKey, provider);

            async function getTokenDecimals(tokenAddress) {
                const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                return Number(await tokenContract.decimals());
            }

            // Convert BigInt to readable number
            async function convertBigNumberToNumber(tokenAddress, amountInUnits) {
                const decimals = await getTokenDecimals(tokenAddress);
                return Number(ethers.formatUnits(amountInUnits, decimals));
            }

            // Convert number to BigInt with proper decimals
            async function convertNumberToBigInt(tokenAddress, amount) {
                const decimals = await getTokenDecimals(tokenAddress);
                return ethers.parseUnits(amount.toFixed(decimals).toString(), decimals);
            }

            // Perform swap function
            async function performSwap(amountIn, tokenIn, tokenOut) {
                try {

                    const router = new ethers.Contract(ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, wallet);

                    const path = tokenIn === ZeroAddress
                        ? ["0x4200000000000000000000000000000000000006", tokenOut] // ETH -> Token
                        : [tokenIn, tokenOut]; // Token -> Token

                    console.log({ path });

                    const amountsOut = await router.getAmountsOut(amountIn, path);
                    const amountOutMin = amountsOut[amountsOut.length - 1];
                    const amountOutNumber = await convertBigNumberToNumber(tokenOut, amountOutMin);

                    // Apply 3% slippage
                    const amountOutMinWithSlippage = await convertNumberToBigInt(tokenOut, amountOutNumber * 0.97);

                    // Set deadline (10 minutes from now)
                    const deadline = Math.floor(Date.now() / 1000) + 600;

                    let tx;

                    tx = await router.swapExactETHForTokens(
                        amountOutMinWithSlippage,
                        path,
                        wallet.address,
                        deadline,
                        { value: amountIn }
                    );

                    await tx.wait();
                    console.log(`Swap successful: https://basescan.org/tx/${tx.hash}`);
                } catch (error) {
                    console.log("Pair does not exist");
                }
            }

            const tokenIn = `0x0000000000000000000000000000000000000000`;
            const isETH = tokenIn === ZeroAddress;
            const amountInUnits = isETH
                ? ethers.parseUnits(String(amountIn), 18)
                : await convertNumberToBigInt(tokenIn, parseFloat(amountIn));

            await performSwap(amountInUnits, tokenIn, tokenOut);
        } catch (error) {
            Red(`butTokenETH ----- ${error}`)
        }
    },


    sellTokenETH: async (privateKey, tokenIn, amountIn) => {
        try {

            const wallet = new ethers.Wallet(privateKey, provider);

            async function getTokenDecimals(tokenAddress) {
                const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                return Number(await tokenContract.decimals());
            }

            async function convertBigNumberToNumber(tokenAddress, amountInUnits) {
                const decimals = await getTokenDecimals(tokenAddress);
                return Number(ethers.formatUnits(amountInUnits, decimals));
            }

            async function convertNumberToBigInt(tokenAddress, amount) {
                const decimals = await getTokenDecimals(tokenAddress);
                return ethers.parseUnits(amount.toFixed(decimals).toString(), decimals);
            }

            async function sellToken(amountIn, tokenIn) {
                try {
                    const router = new ethers.Contract(ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, wallet);
                    const path = [tokenIn, WETH_ADDRESS]; // Token -> ETH

                    console.log({ path });

                    const amountsOut = await router.getAmountsOut(amountIn, path);
                    const amountOutMin = amountsOut[amountsOut.length - 1];
                    const amountOutNumber = await convertBigNumberToNumber(WETH_ADDRESS, amountOutMin);

                    console.log(`You will receive approximately ${amountOutNumber} ETH`);

                    const amountOutMinWithSlippage = await convertNumberToBigInt(WETH_ADDRESS, amountOutNumber * 0.9);

                    // Set deadline (10 minutes from now)
                    const deadline = Math.floor(Date.now() / 1000) + 600;

                    const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI_APPROVE, wallet);
                    const approvalTx = await tokenInContract.approve(ROUTER_ADDRESS, amountIn);
                    await approvalTx.wait();
                    console.log(`Approval successful: ${approvalTx.hash}`);

                    // Perform the swap (Token -> ETH)
                    const tx = await router.swapExactTokensForETH(
                        amountIn,
                        amountOutMinWithSlippage,
                        path,
                        wallet.address,
                        deadline
                    );

                    await tx.wait();
                    console.log(`Token sold successfully: https://basescan.org/tx/${tx.hash}`);
                    return amountOutNumber;
                } catch (error) {
                    console.log("Error during sale:", error.message);
                }
            }


            const amountInUnits = await convertNumberToBigInt(tokenIn, parseFloat(amountIn));
            await sellToken(amountInUnits, tokenIn);

        } catch (error) {
            Red(`sellTokenETH ----- ${error}`)
        }
    },
}

module.exports = BaseNetwork;