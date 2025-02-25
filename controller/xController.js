const WalletDBAccess = require("../db/wallet-db-access");
const { getMyTokensInWalletSOL, buyTokenSOL, validateTokenAddress, getSolBalanceSOL, isValidPublicKeySOL } = require("../services/solana");
const chalk = require("chalk");
const axios = require('axios');
const UI = require("../ui");
const PositionUI = require("../ui/positionUI");
const ReferralUI = require("../ui/referralUI");
const XUI = require("../ui/xUI");


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

const XController = {
    xPage: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const findUserWallet = await WalletDBAccess.findWallet(chatId);

            const { title, button } = XUI.xFollowPage(findUserWallet.followXAccount);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`xPage ===> ${error}`);
        }
    },


    xAddAccount: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            bot.sendMessage(chatId, `📨 Input X account to follow`);
            bot.once(`message`, async (newMessage) => {
                const newXAccount = newMessage.text;
                const isexisted = await WalletDBAccess.findWallet(chatId);
                const isExistResult = await isexisted.followXAccount.filter((x) => x.xaccount === newXAccount);

                console.log(`isExistResult ====🚀`, JSON.stringify(isExistResult));

                if (isExistResult.length > 0) {
                    bot.sendMessage(chatId, `🚫 Mirror already exists, try another one!`);
                }
                else {
                    const result = await WalletDBAccess.saveXWallet(chatId, { $addToSet: { followXAccount: { xaccount: newXAccount, status: 'false' } } });
                    if (!result) {
                        Red(`X account save error!!`);
                    } else {
                        const isexisted = await WalletDBAccess.findWallet(chatId);
                        const { title, button } = XUI.xFollowPage(isexisted.followXAccount);
                        await UI.switchMenu(bot, chatId, messageId, title, button,);
                        bot.sendMessage(chatId, title,
                            {
                                reply_markup: {
                                    inline_keyboard: button
                                },
                                parse_mode: 'HTML'
                            }
                        );
                    }
                }
            })

        } catch (error) {
            Red(`xAddAccount ==== > ${error}`);
        }
    },


    xDeleteAccount: async (bot, queryData, account) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const isexisted = await WalletDBAccess.deleteItemInArray(chatId, account);

            const { title, button } = XUI.xFollowPage(isexisted);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
            bot.sendMessage(chatId, title,
                {
                    reply_markup: {
                        inline_keyboard: button
                    },
                    parse_mode: 'HTML'

                })
        } catch (error) {
            Red(`xDeleteAccount ==== > ${error}`);
        }
    },

}

module.exports = XController;