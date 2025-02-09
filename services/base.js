const bs58 = require('bs58');
const fetch = require('cross-fetch')
const chalk = require('chalk');
const dotenv = require('dotenv');
const { ethers } = require("ethers");
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

const ROUTER_ABI = [
    "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] memory)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) external returns (uint[] memory)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) external returns (uint[] memory)",
    "function WETH() external pure returns (address)",
    "function getAmountsOut(uint amountIn, address[] path) external view returns (uint[] memory)"
];

const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
];



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


    buyTokenETH: async (tokenToBuy, amountInETH) => {
        try {

            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            const routerContract = new ethers.Contract(DEX_ROUTER_ADDRESS, ROUTER_ABI, wallet);

            const amountInWei = ethers.parseEther(amountInETH.toString());
            const path = [WETH_ADDRESS, tokenToBuy]; // ETH -> token path

            const amountsOut = await routerContract.getAmountsOut(amountInWei, path);
            const amountOutMin = amountsOut[1] - (amountsOut[1] * 5n) / 100n; // slippage tolerance, remove 5%

            const deadline = Math.floor(Date.now() / 1000) + 60 * 10; //10 minutes from now
            const to = wallet.address
            const tx = {
                value: amountInWei,
                gasLimit: 300000
            }

            const signedTx = await routerContract.swapExactETHForTokens(
                amountOutMin,
                path,
                to,
                deadline,
                tx
            );

            console.log("Transaction sent:", signedTx.hash);
            const receipt = await signedTx.wait()
            if (receipt && receipt.status == 1) {
                console.log("Transaction successful!");
                return receipt
            }
            else {
                throw new Error("Transaction failed")
            }
        } catch (error) {
            console.error("Error buying token:", error)
            throw error
        }
    },


}

module.exports = BaseNetwork;