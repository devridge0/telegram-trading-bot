const WalletDBAccess = require("../db/wallet-db-access");
const { getMyTokensInWalletSOL, buyTokenSOL, validateTokenAddress, getSolBalanceSOL, isValidPublicKeySOL } = require("../services/solana");
const chalk = require("chalk");
const axios = require('axios');
const UI = require("../ui");
const PositionUI = require("../ui/positionUI");
const ReferralUI = require("../ui/referralUI");


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

const ReferralController = {
    referralPage: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const findUserWallet = await WalletDBAccess.findWallet(chatId);

            const { title, button } = ReferralUI.referralPage(chatId, findUserWallet.publicKey);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`referralPage ===> ${error}`);
        }
    },

    setWalletForCommission: async (bot, queryData) => {
        try {
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const findUserWallet = await WalletDBAccess.findWallet(chatId);

            const title = `
<strong>Fee Receiver Wallet already added</strong>

<strong>Wallet Address</strong>: <code>${findUserWallet.publicKey}</code>

If you want to change it, just send a new one. Otherwise <code>/start</code> to go back to the main menu.`

            await bot.sendMessage(chatId, title, {
                reply_markup: {},
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            });
            bot.once(`message`, async (msg) => {
                const commissionWallet = msg.text;
                const validResult = await isValidPublicKeySOL(commissionWallet);
                if (!validResult) {
                    bot.sendMessage(chatId, `Not invalid addresss`);
                }
                else {
                    const updateResult = await WalletDBAccess.findOneAndUpdateWallet(chatId, { referralWallet: commissionWallet });
                    if (!updateResult) {
                        bot.sendMessage(chatId, `Save failed.`).then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                        return;
                    }
                    else {
                        bot.sendMessage(chatId, `Save Successfully.`).then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                    }
                }
            })
        } catch (error) {
            Red(`setWalletForCommission === >  ${error}`)
        }
    }

}

module.exports = ReferralController;