const { createWalletSOL, getSolBalanceSOL } = require('../services/solana');
const axios = require('axios');
const dotenv = require('dotenv');
const chalk = require("chalk");
const UI = require("../ui");
const WalletDBAccess = require("../db/wallet-db-access");
dotenv.config()

const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

let currentPublicKey;
let getMyWalletBalance;
let currentSOLUSD;
(async () => {
    try {
        currentSOLUSD = axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);
    } catch (error) {
        Red(`currentSOLUSD ===>  ${error}`)
    }
})
const StartController = {
    back: async (bot, queryData) => {
        try {

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            if (!currentSOLUSD || !getMyWalletBalance) {
                const findUserWallet = await WalletDBAccess.findWallet(chatId);
                currentSOLUSD = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);
                usd = currentSOLUSD.data.solana.usd;
                getMyWalletBalance = await getSolBalanceSOL(findUserWallet.publicKey);
            }

            const { title, button } = UI.landingPage(getMyWalletBalance, currentSOLUSD.data.solana.usd);
            await UI.switchMenu(bot, chatId, messageId, title, button)
        } catch (error) {
            Red(`back ===> ${error}`)
        }
    },

    startCommand: async (bot, chatId, userId) => {
        try {
            const adminWallet = process.env.ADMIN_WALLET_SOL;
            const adminWalletResult = await WalletDBAccess.findAdminWallet(adminWallet);
            if (adminWalletResult.length <= 0) {
                await WalletDBAccess.saveAdminWallet(adminWallet);
            }

            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            currentPublicKey = findUserWallet.publicKey;
            currentPrivateKey = findUserWallet.privateKey;
            Blue(findUserWallet)

            if (!findUserWallet) {
                const { publicKey, privateKey } = await createWalletSOL();
                currentPublicKey = publicKey;
                const saveResult = await WalletDBAccess.saveWallet(userId, chatId, publicKey, privateKey);
                if (!saveResult) {
                    console.log(`saveResult ====🚀 FAILED`);
                }
            }

            let currentSOLUSD = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);

            getMyWalletBalance = await getSolBalanceSOL(currentPublicKey);

            Red(`${getMyWalletBalance}SOL ~ ${currentSOLUSD.data.solana.usd}`);
            const { title, button } = UI.landingPage(getMyWalletBalance, currentSOLUSD.data.solana.usd);
            bot.sendMessage(chatId, title,
                {
                    reply_markup: {
                        inline_keyboard: button
                    }
                }
            );

        } catch (error) {
            Red(`startCommand ===>  ${error}`)
        }

    }
}
module.exports = StartController;
