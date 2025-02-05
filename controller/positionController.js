const WalletDBAccess = require("../db/wallet-db-access");
const { getMyTokensInWalletSOL, JUPITER_TOKN_SWAP, validateTokenAddress, getSolBalanceSOL, burnMyTokenSOL } = require("../services/solana");
const chalk = require("chalk");
const axios = require('axios');
const UI = require("../ui");
const PositionUI = require("../ui/positionUI");


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));



const PositionController = {
    positionSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            const { title, button } = PositionUI.depositPage();
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`positionMyTokenSOL ===> ${error}`);
        }
    },

    positionBackPageSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const { title, button } = PositionUI.depositPage();
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`positionBackPageSOL ===> ${error}`);
        }
    },

    positionMyTokenSOL: async (bot, queryData, pageNumber = 0) => {
        try {

            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;
            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            const myTokens = await getMyTokensInWalletSOL(findUserWallet.publicKey);

            if (myTokens.length <= 0) {
                const { title, button } = PositionUI.myTokensEmptyPage();
                await UI.switchMenu(bot, chatId, messageId, title, button,);
                return;
            } else {
                if (!queryData.message || pageNumber < 0 || pageNumber > myTokens.length - 1) {
                    console.log('no queryData.message');
                    return;
                }
                const { title, button } = PositionUI.myTokensPage(myTokens[pageNumber], pageNumber);
                await UI.switchMenu(bot, chatId, messageId, title, button,);
            }

        } catch (error) {
            Red(`positionMyTokenSOL ===> ${error}`);
        }
    },
    positionTokenBuySOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            await bot.sendMessage(chatId, `Provide token address to buy ⬇️`);
            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            bot.once('message', async (newMsg) => {
                const mintAddress = newMsg.text;
                const validResult = await validateTokenAddress(mintAddress);
                if (!validResult) {
                    bot.sendMessage(chatId, `Token not found, try another one!`)
                } else {
                    await bot.sendMessage(chatId, `📨 Provide amount to buy below (in SOL)`);
                    bot.once(`message`, async (newMessage) => {
                        const butAmount = newMessage.text;
                        const currentAmount = await getSolBalanceSOL(findUserWallet.publicKey);
                        if (butAmount > currentAmount) {
                            await bot.sendMessage(chatId, `Not enought SOL`);
                        } else {
                            await bot.sendMessage(chatId, `Current SOL +++ ${currentAmount}`);
                            const buyTokenResult = await JUPITER_TOKN_SWAP(mintAddress, findUserWallet.privateKey, butAmount, findUserWallet.slippage, mode = 'buy');
                            if (!buyTokenResult) {
                                await bot.sendMessage(chatId, `Token buy failed.`);
                            } else {
                                await bot.sendMessage(chatId, `Token buy successful.`);
                                // const { title, button } = PositionUI.myTokensPage(myTokens[pageNumber], pageNumber);
                                // await UI.switchMenu(bot, chatId, messageId, title, button,);
                            }
                        }

                    })
                }
            });

        } catch (error) {
            Red(`positionToeknBuySOL ===> ${error}`);
        }
    },
    positionSellAndManageSOL: async (bot, queryData, pageNumber = 0) => {
        try {
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            const myTokens = await getMyTokensInWalletSOL(findUserWallet.publicKey);
            if (myTokens.length <= 0) {
                // const { title, button } = PositionUI.myTokensEmptyPage();
                // await UI.switchMenu(bot, chatId, messageId, title, button,);
                return;
            } else {
                const { title, button } = PositionUI.myTokensBuyAndSellPage(myTokens[pageNumber], pageNumber);
                await UI.switchMenu(bot, chatId, messageId, title, button,);
            }

        } catch (error) {
            Red(`positionSellAndManageSOL ===> ${error}`);
        }
    },

    positionCurrentTokenBuySOL: async (bot, queryData, tokenAddress) => {
        try {

            if (!queryData.message || !tokenAddress) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            await bot.sendMessage(chatId, `📨 Provide amount to buy below (in SOL)`);
            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            bot.once('message', async (newMsg) => {
                const buyAmount = newMsg.text;
                const currentTokenBuyResult = await JUPITER_TOKN_SWAP(tokenAddress, findUserWallet.privateKey, Number(buyAmount), findUserWallet.slippage,findUserWallet.jitoTip, mode = 'buy');
                if (!currentTokenBuyResult) {
                    bot.sendMessage(chatId, `Token buy failed.`);
                    return;
                } else bot.sendMessage(chatId, `Token buy successfult.`)
            });

        } catch (error) {
            Red(`positionCurrentTokenBuySOL ===> ${error}`);
        }
    },

    positionCurrentTokenSellSOL: async (bot, queryData, tokenAddress) => {
        try {

            if (!queryData.message || !tokenAddress) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;

            await bot.sendMessage(chatId, `📨 Provide amount to sell below (in %)`);
            bot.once('message', async (newMsg) => { 
                const sellAmount = newMsg.text;
                if (Number(sellAmount) != sellAmount) {
                    bot.sendMessage(chatId, `Invalid sell amount.`);
                    return;
                }
                const findUserWallet = await WalletDBAccess.findWallet(chatId);
                const myTokens = await getMyTokensInWalletSOL(findUserWallet.publicKey);
                const sellToken = myTokens.filter((token) => token.mint == tokenAddress);
                const newAmount = Math.floor((Number(sellToken[0].amount) * (Number(sellAmount) / 100)));
                const decimalsAmount = 10 ** Number(sellToken[0].decimals);

                const finalAmount = BigInt(newAmount * decimalsAmount);
                Blue(finalAmount);

                const currentTokenBuyResult = await JUPITER_TOKN_SWAP(tokenAddress, findUserWallet.privateKey, finalAmount, findUserWallet.slippage, findUserWallet.jitoTip, mode = 'sell');
                if (!currentTokenBuyResult) {
                    bot.sendMessage(chatId, `Token sell failed.`);
                    return;
                } else bot.sendMessage(chatId, `Token sell successfully.`)
            });

        } catch (error) {
            Red(`positionCurrentTokenSellSOL ===> ${error}`);
        }
    },

    positionCurrentTokenBurnSOL: async (bot, queryData, tokenAddress) => {
        try {

            if (!queryData.message || !tokenAddress) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const messageId = queryData.message?.message_id;

            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            const currentAmount = await getSolBalanceSOL(findUserWallet.publicKey);
            const { title, button } = PositionUI.myTokensBurnPage(currentAmount, tokenAddress)
            bot.sendMessage(chatId, title,
                {
                    reply_markup: {
                        inline_keyboard: button
                    }
                }
            );

        } catch (error) {
            Red(`positionCurrentTokenBurnSOL ===> ${error}`);
        }
    },
    positionCurrentTokenBurnNoSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, `Token burn cancelled 🚫`).then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });


        } catch (error) {
            Red(`positionCurrentTokenBurnNoSOL ===> ${error}`);
        }
    },
    positionCurrentTokenBurnYesSOL: async (bot, queryData, tokenAddress) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            bot.sendMessage(chatId, `📨 Provide amount to burn below (in %)`)
            bot.once(`message`, async (newMessage) => {
                try {

                    let burnAmount = Number(newMessage.text);
                    const findUserWallet = await WalletDBAccess.findWallet(chatId);
                    const myTokens = await getMyTokensInWalletSOL(findUserWallet.publicKey);
                    const sellToken = myTokens.filter((token) => token.mint == tokenAddress);

                    Green(JSON.stringify(sellToken));
                    const newAmount = Math.floor((Number(sellToken[0].amount) * (burnAmount / 100)))
                    const burnResult = await burnMyTokenSOL(tokenAddress, findUserWallet.privateKey, burnAmount);
                    if (!burnResult) {
                        bot.sendMessage(chatId, `Token burn failed.`);
                        return;
                    } else bot.sendMessage(chatId, `Token burn successfult.`)
                } catch (error) {
                    Red(`token burn function ===> ${error}`);

                }
            })

        } catch (error) {
            Red(`positionCurrentTokenBurnYesSOL ===> ${error}`);
        }
    },
    positionMyTradePageSOL: async (bot, queryData, pageNumber = 0) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const myTradeResult = await WalletDBAccess.findCopyTradingHistory(chatId);
            if (!myTradeResult) {

                const { title, button } = PositionUI.myTradesEmptyPage();
                await UI.switchMenu(bot, chatId, messageId, title, button,);
                return
            } else {
                // const myTradeResult = [
                //     { tokenName: 'sol-cat', price: 0.00234, currentPrice: 0.00524, myWallet: "kdfjg83hskldjfaosdk", copyWallet: "29dsjlazxxlkjearj2" },
                //     { tokenName: 'sol-cat', price: 0.00234, currentPrice: 0.00824, myWallet: "kdfjg83hskldjfaosdk", copyWallet: "29dsjlazxxlkjearj2" },
                //     { tokenName: 'water-sol', price: 0.00534, currentPrice: 0.00724, myWallet: "kdfjg83hskldjfaosdk", copyWallet: "29dsjlazxxlkjearj2" },
                //     { tokenName: 'hot-guy', price: 0.00234, currentPrice: 0.00524, myWallet: "kdfjg83hskldjfaosdk", copyWallet: "29dsjlazxxlkjearj2" },
                //     { tokenName: 'sol-cat', price: 0.00334, currentPrice: 0.01524, myWallet: "kdfjg83hskldjfaosdk", copyWallet: "29dsjlazxxlkjearj2" },
                // ]

                const { title, button } = PositionUI.myTradesPage(myTradeResult[pageNumber], pageNumber);
                await UI.switchMenu(bot, chatId, messageId, title, button,);
            }

        } catch (error) {
            Red(`positionMyTradePageSOL ====>  ${error}`)
        }
    }

}

module.exports = PositionController;