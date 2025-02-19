const chalk = require("chalk");
const axios = require('axios');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const BaseWalletDBAccess = require("../../db/base/basewallet-db-access");
const BaseTargetWallet = require("../../models/base/baseTargetWallet");
const BaseUI = require("../../ui/base/baseLandingUI");
const BaseCopyTradingUI = require("../../ui/base/baseCopyTradingUI");
const { isValidBasePublicKey, buyTokenETH, sellTokenETH } = require("../../services/base");
const getWhaleAddressTransaction = require("../../services/baseCopyTradingServices");
dotenv.config();

const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

let copyTradingAction;
var INTERVAL_IDS = []


const BaseCopyTradingController = {
    copyTradingPageETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const whaleWalletList = await BaseWalletDBAccess.findBaseAllTargetWallet(chatId);
            const { title, button } = BaseCopyTradingUI.copyTradingPage(whaleWalletList);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);

        } catch (error) {
            Red(`copyTradingPageETH ==== > ${error}`);
        }
    },

    copyTradingAddNewWalletPageETH: async (bot, queryData) => {
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
                const validResult = await isValidBasePublicKey(copyAddress);
                const isexisted = await BaseWalletDBAccess.findBaseTargetWallet(chatId, copyAddress);
                if (!validResult) {
                    bot.sendMessage(chatId, `🚫 Invalid wallet address`);
                } else if (isexisted) {
                    bot.sendMessage(chatId, `🚫 Mirror already exists, try another one!`);
                }
                else {
                    bot.sendMessage(chatId, `📨 Give wallet a label`);
                    bot.once(`message`, async (msg) => {
                        const targetWalletName = msg.text;
                        const result = await BaseWalletDBAccess.saveBaseTargetWallet(chatId, copyAddress, targetWalletName);
                        if (!result) {
                            Red(`baseTargetWallet save error!!`);
                        } else {
                            bot.sendMessage(chatId, `Wallet added to copy trading list 🎉`);
                            const whaleWalletList = await BaseWalletDBAccess.findBaseAllTargetWallet(chatId);
                            const { title, button } = BaseCopyTradingUI.copyTradingPage(whaleWalletList);
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
            Red(`copyTradingAddNewWalletPageETH ==== > ${error}`);
        }
    },

    copyTradingWhaleWalletPageETH: async (bot, queryData, address) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const whaleWalletList = await BaseWalletDBAccess.findBaseTargetWallet(chatId, address);
            const { title, button } = BaseCopyTradingUI.whalePage(whaleWalletList);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);

        } catch (error) {
            Red(`copyTradingWhaleWalletPageETH ===>  ${error}`)
        }
    },

    copyTradingDeleteWhaleWalletPageETH: async (bot, queryData, address) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            Green(address)
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            const deleteTargetWalletResult = await BaseWalletDBAccess.deleteBaseTargetWallet(chatId, address);
            if (!deleteTargetWalletResult) Red(`delete_traget wallet error`);

            const whaleWalletList = await BaseWalletDBAccess.findBaseAllTargetWallet(chatId);
            const { title, button } = BaseCopyTradingUI.copyTradingPage(whaleWalletList);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);

        } catch (error) {
            Red(`copyTradingDeleteWhaleWalletPageETH ====>   ${error}`)
        }
    },

    copyTradingStartAndStopPageETH: async (bot, queryData, status) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const userId = queryData.message.chat.username;

            const newData = status.split("_");
            await BaseWalletDBAccess.statusUpdateBaseTargetWallet(chatId, newData[0], newData[1]);
            const whaleWalletList = await BaseWalletDBAccess.findBaseAllTargetWallet(chatId);
            const { title, button } = BaseCopyTradingUI.copyTradingPage(whaleWalletList);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);

            let whaleTransactionResult;

            const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId)

            if (newData[1] !== 'true') {
                copyTradingAction = setInterval(async () => {
                    whaleTransactionResult = await getWhaleAddressTransaction(newData[0]);

                    if (!INTERVAL_IDS.includes(copyTradingAction)) {
                        INTERVAL_IDS.push(copyTradingAction);
                    }

                    Blue(JSON.stringify(whaleTransactionResult, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value));

                    if (whaleTransactionResult === undefined || whaleTransactionResult.length == 0) {
                        return;
                    }
                    if (whaleTransactionResult[0].sendToken == `0x4200000000000000000000000000000000000006`) {
                        if (findUserBaseWallet.buyAmount.toString().includes(`1e-`)) {
                            const minBuyAmount = findUserBaseWallet.buyAmount.toFixed(Number(findUserBaseWallet.buyAmount.toString().slice(-1)));
                            await buyTokenETH(findUserBaseWallet.privateKey, whaleTransactionResult[0].receiveToken, minBuyAmount);
                        }
                        else await buyTokenETH(findUserBaseWallet.privateKey, whaleTransactionResult[0].receiveToken, findUserBaseWallet.buyAmount);
                    }
                    else if (whaleTransactionResult[0].receiveToken == `0x4200000000000000000000000000000000000006`) {
                        function fromFixedPoint(fixedPointStr, decimals) {
                            const divisor = 10 ** decimals;
                            const num = Number(fixedPointStr) / divisor; // Use Number to handle potentially large values correctly
                            return num // Return as a string to maintain precision
                        }

                        // Example
                        const fixedPointValue = whaleTransactionResult[0].amountIn;
                        const decimals = 18;
                        const result = fromFixedPoint(fixedPointValue, decimals);
                        const sellResult = await sellTokenETH(findUserBaseWallet.privateKey, whaleTransactionResult[0].sendToken, Number(result))
                    }
                    else {
                        try {
                            Blue(`swap`)
                            const swapBuyAmount = await sellTokenETH(findUserBaseWallet.privateKey, whaleTransactionResult[0].sendToken, 30);
                            function fromFixedPoint(fixedPointStr, decimals) {
                                const divisor = 10 ** decimals;
                                const num = Number(fixedPointStr) / divisor; // Use Number to handle potentially large values correctly
                                return num // Return as a string to maintain precision
                            }

                            const fixedPointValue = swapBuyAmount;
                            const decimals = 18;
                            const result = fromFixedPoint(fixedPointValue, decimals);

                            console.log(`🤣🤣🤣🤣 ${result}`)
                            await buyTokenETH(findUserBaseWallet.privateKey, whaleTransactionResult[0].receiveToken, Number(result));
                        } catch (error) {
                            Red(`copyTradingStartAndStop ====>   ${error}`)
                        }
                    }


                }, 1000);


            } else {
                console.log(`INTERVAL_IDS--------${INTERVAL_IDS}`)
                INTERVAL_IDS.map((x) => {
                    setTimeout(() => {
                        clearInterval(x)

                    }, 1000)
                })
            }
        } catch (error) {
            Red(`copyTradingStartAndStopPageETH ====>   ${error}`)
        }
    },


}

module.exports = BaseCopyTradingController;