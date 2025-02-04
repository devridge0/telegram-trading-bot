const axios = require('axios');

const chalk = require("chalk");
const BaseWalletDBAccess = require('../../db/base/basewallet-db-access');
const { createBaseWalletETH, getBaseWalletBalance } = require('../../services/base');
const BaseUI = require('../../ui/base/baseLandingUI');


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

let currentPublicKey;
let getMyWalletETHBalance;
let currentETHUSD;
(async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&chain=base');
        if (response.data && response.data.ethereum && response.data.ethereum.usd) {
            const ethPrice = response.data.ethereum.usd;
            console.log("Current ETH Price on Base (USD):", ethPrice);
            currentETHUSD = ethPrice;
        }

    } catch (error) {
        console.error("Error fetching ETH price:", error);
        throw error;
    }
})
const BaseStartController = {
    baseBack: async (bot, queryData) => {
        try {

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            if (!currentETHUSD || !getMyWalletETHBalance) {
                const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);
                currentETHUSD = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&chain=base`);
                usd = currentETHUSD
                getMyWalletETHBalance = await getSolBalanceSOL(findUserBaseWallet.publicKey);
            }

            const { title, button } = BaseUI.landingPage(getMyWalletETHBalance, currentETHUSD.data.ethereum.usd);

            await UI.switchMenu(bot, chatId, messageId, title, button)
        } catch (error) {
            Red(`baseBack ===> ${error}`)
        }
    },

    baseStartCommand: async (bot, queryData) => {
        try {
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;
            const messageId = queryData.message?.message_id;

            const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);
            currentPublicKey = findUserBaseWallet.publicKey;
            currentPrivateKey = findUserBaseWallet.privateKey;

            if (!findUserBaseWallet) {
                const { publicKey, privateKey } = await createBaseWalletETH();
                currentPublicKey = publicKey;
                const saveResult = await BaseWalletDBAccess.saveBaseWallet(userId, chatId, publicKey, privateKey);
                if (!saveResult) {
                    console.log(`saveResult ====🚀 FAILED`);
                }
            }

            let currentETHUSD = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&chain=base`);
            getMyWalletETHBalance = await getBaseWalletBalance(currentPublicKey);
            White(`${getMyWalletETHBalance}ETH ~ ${currentETHUSD.data.ethereum.usd}`);
            const { title, button } = BaseUI.landingPage(getMyWalletETHBalance, currentETHUSD.data.ethereum.usd);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button)

        } catch (error) {
            Red(`baseStartCommand ===>  ${error}`)
        }

    }
}
module.exports = BaseStartController;