const WalletDBAccess = require("../db/wallet-db-access");
const { getMyTokensInWalletSOL, isValidPublicKeySOL, JUPITER_TOKN_SWAP, getSwapInfoforWallet, validateTokenAddress, getSolBalanceSOL, burnMyTokenSOL } = require("../services/solana");
const chalk = require("chalk");
const axios = require('axios');
const UI = require("../ui");
const CopyTradingUI = require("../ui/copyTradingUI");
const TargetWallet = require("../models/targetWallet");
const { StartCopyTrading, AddorRemoveTradingWallet, startTracking, stopTracking } = require("../services/copytradingServices");
const WebSocket = require('ws');
const dotenv = require('dotenv');
dotenv.config();


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

const WS = new WebSocket(process.env.SOLANA_WSS_ENDPOINT);

const CopyTradingController = {
    copyTradingPageSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const whaleWalletList = await WalletDBAccess.findAllTargetWallet(chatId);
            const { title, button } = CopyTradingUI.copyTradingPage(whaleWalletList);
            await UI.switchMenu(bot, chatId, messageId, title, button,);

        } catch (error) {
            Red(`copyTradingPageSOL ==== > ${error}`);
        }
    },

    copyTradingAddNewWalletPageSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            bot.sendMessage(chatId, `📨 Send wallet address to copy`);
            bot.once(`message`, async (newMessage) => {
                const copyAddress = newMessage.text;
                const validResult = await isValidPublicKeySOL(copyAddress);
                const isexisted = await WalletDBAccess.findTargetWallet(chatId, copyAddress);
                if (!validResult) {
                    bot.sendMessage(chatId, `🚫 Invalid wallet address`);
                } else if (isexisted) {
                    bot.sendMessage(chatId, `🚫 Mirror already exists, try another one!`);
                }
                else {
                    bot.sendMessage(chatId, `📨 Give wallet a label`);
                    bot.once(`message`, async (msg) => {
                        const targetWalletName = msg.text;
                        const result = await WalletDBAccess.saveTargetWallet(chatId, copyAddress, targetWalletName);
                        if (!result) {
                            Red(`targetWallet save error!!`);
                        } else {
                            bot.sendMessage(chatId, `Wallet added to copy trading list 🎉`);
                            const whaleWalletList = await WalletDBAccess.findAllTargetWallet(chatId);
                            const { title, button } = CopyTradingUI.copyTradingPage(whaleWalletList);
                            bot.sendMessage(chatId, title,
                                {
                                    reply_markup: {
                                        inline_keyboard: button
                                    },
                                    parse_mode: 'HTML'
                                }
                            );
                        }
                    })
                }
            })

        } catch (error) {
            Red(`copyTradingAddNewWalletPageSOL ==== > ${error}`);
        }
    },

    copyTradingWhaleWalletPageSOL: async (bot, queryData, address) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const whaleWalletList = await WalletDBAccess.findTargetWallet(chatId, address);

            const { title, button } = CopyTradingUI.whalePage(whaleWalletList);
            await UI.switchMenu(bot, chatId, messageId, title, button,);

        } catch (error) {
            Red(`copyTradingWhaleWalletPageSOL ===>  ${error}`)
        }
    },

    copyTradingDeleteWhaleWalletPageSOL: async (bot, queryData, address) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            const deleteTargetWalletResult = await WalletDBAccess.deleteTargetWallet(chatId, address);
            if (!deleteTargetWalletResult) Red(`delete_traget wallet error`);

            const whaleWalletList = await WalletDBAccess.findAllTargetWallet();
            const { title, button } = CopyTradingUI.copyTradingPage(whaleWalletList);
            await UI.switchMenu(bot, chatId, messageId, title, button,);

        } catch (error) {
            Red(`copyTradingDeleteWhaleWalletPageSOL ====>   ${error}`)
        }
    },

    copyTradingStartAndStopPageSOL: async (bot, queryData, status) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const userId = queryData.message.chat.username;

            const newData = status.split("_");

            await WalletDBAccess.statusUpdateTargetWallet(chatId, newData[0], newData[1]);
            const whaleWalletList = await WalletDBAccess.findAllTargetWallet(chatId);
            const { title, button } = CopyTradingUI.copyTradingPage(whaleWalletList);
            await UI.switchMenu(bot, chatId, messageId, title, button,);

            if (newData[1] == 'true') {
                await stopTracking(newData[0], chatId);
            }
            else {
                await startTracking(newData[0], chatId);
            }
            // const myTargetWallet = await WalletDBAccess.findTargetWallet(chatId, newData[0]);
            // await CopyTradingController.actionMainCopyTrading(bot, userId, chatId, myTargetWallet.address, myTargetWallet.status)

        } catch (error) {
            Red(`copyTradingStartAndStopPageSOL ====>   ${error}`)
        }
    },

    actionMainCopyTrading: async (bot, userId, chatId, address, status) => {
        try {
            let newStatus = status;
            if (newStatus == 'false') {
                return;
            }

            else {
                const result = await getSwapInfoforWallet(address);
                if (result.isSwap) {
                    console.log(`📌 Find oppotunity!!!📌`);
                    Green(JSON.stringify(result))
                    bot.sendMessage(chatId, `Find oppounity!!`);
                    const findUserWallet = await WalletDBAccess.findWallet(chatId);
                    const currentSolBalance = await getSolBalanceSOL(findUserWallet.publicKey);
                    if (currentSolBalance * (10 ** 9) < findUserWallet.jitoTip) {
                        bot.sendMessage(chatId, `Not enough SOL balance.`);
                        return;
                    }

                    let mode;
                    let copyTradingResult;
                    if (result.receiveToken == `So11111111111111111111111111111111111111112`) {
                        mode = "sell";
                        const sellAmount = await getSellTokenAmount(findUserWallet.publicKey, result.sendToken);
                        Blue(`sell Amount  --------> ${sellAmount}`)
                        copyTradingResult = await JUPITER_TOKN_SWAP(result.sendToken, findUserWallet.privateKey, sellAmount, findUserWallet.slippage, findUserWallet.jitoTip, mode);
                    } else {
                        mode = 'buy';
                        copyTradingResult = await JUPITER_TOKN_SWAP(result.receiveToken, findUserWallet.privateKey, findUserWallet.buyAmount, findUserWallet.slippage, findUserWallet.jitoTip, mode);
                    }
                    if (copyTradingResult) {
                        const saveCopyTradingResult = await WalletDBAccess.saveCopyTradingHistory(userId, chatId, result.sendToken, result.receiveToken, findUserWallet.publicKey, address, mode)
                    }

                }
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            const updateData = await WalletDBAccess.findTargetWallet(chatId, address);
            if (updateData.status == 'false') {
                return;
            }
            CopyTradingController.actionMainCopyTrading(bot, updateData.userId, updateData.chatId, address, updateData.status);
        } catch (error) {
            Red(`actionMainCopyTrading ====>   ${error}`);
        }
    }

}

module.exports = CopyTradingController;