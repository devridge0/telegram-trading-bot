const bs58 = require('bs58');
const fetch = require('cross-fetch')
const chalk = require('chalk');
const dotenv = require('dotenv');
const { ethers } = require("ethers");
dotenv.config();

let newSignList = [];

const Red = (str) => console.log(chalk.bgRed(`${str}\n`));
const Yellow = (str) => console.log(chalk.bgYellow(`${str}\n`));
const Blue = (str) => console.log(chalk.bgBlue(`${str}\n`));
const Green = (str) => console.log(chalk.bgGreen(`${str}\n`));
const White = (str) => console.log(chalk.bgWhite(`${str}\n`));



const BASE_RPC = `https://base-sepolia.g.alchemy.com/v2/4XJ2-1bwaIzXLGsmYF-bGcQVp7GaFrgR`
let provider =  new ethers.JsonRpcProvider(BASE_RPC);

const BaseNetwork = {
    createBaseWalletETH: async () => {
        try {
            const randomBytes = ethers.randomBytes(32);
            const privateKey = ethers.hexlify(randomBytes);
            const wallet = new ethers.Wallet(privateKey);
            const publicKey = wallet.address;

            return { publicKey, privateKey };
        } catch (error) {
            Red(`createBaseWalletETH ====🚀`, error);
        }
    },

    getBaseWalletBalance: async (publicKey) => {
        try {
            Green(JSON.stringify(provider))
            const balanceWei = await provider.getBalance(publicKey);
            const balanceEth = ethers.formatEther(balanceWei);

            return balanceEth;
        } catch (error) {
            Red(`getBaseWalletBalance ====🚀`, error);
        }
    },

}


module.exports = BaseNetwork;