const chalk = require("chalk");
const axios = require('axios');
const BaseWalletUI = require("../../ui/base/baseWalletUI");
const BaseUI = require("../../ui/base/baseLandingUI");
const BaseWalletDBAccess = require("../../db/base/basewallet-db-access");
const { createBaseWalletETH, getBaseWalletBalance, isValidBasePrivateKey, getBasePublicKeyFromPrivateKey, isValidBasePublicKey, transferAllEth, transferCustomerAmountEth } = require("../../services/base");
const BaseDepositUI = require("../../ui/base/baseDepositUI");

let depostUrl = `https://buy.moonpay.com/?apiKey=pk_live_TBeEWwlvSTuyxLSueHu3dINixf4LEt&currencyCode=ETH&walletAddress=`;
let ethscanUrl = `https://basescan.org/address`;

const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

let withdrawWalletAddress;

const BaseWalletController = {
    baseWallet: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);

            const data = queryData.data;
            const messageId = queryData.message?.message_id;

            if (!data) {
                console.log('no queryData.data');
                return;
            }
            const url = {
                deposit: `${depostUrl}${findUserBaseWallet.publicKey}`,
                ethscan: `${ethscanUrl}/${findUserBaseWallet.publicKey}`
            }
            const { title, button } = BaseWalletUI.walletPage(findUserBaseWallet.publicKey, findUserBaseWallet.privateKey, url);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`basewallet ====>  ${error}`);
        }
    },

    baseWalletDeleteETH: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);
            const { title, button } = BaseWalletUI.deleteWalletPage(findUserBaseWallet.publicKey);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`baseWalletDeleteETH ====>  ${error}`);
        }
    },

    walletDeleteYesETH: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            const deleteWalletResult = await BaseWalletDBAccess.deleteBaseWallet(chatId);
            if (deleteWalletResult) {
                const { title, button } = BaseWalletUI.createAndImportWalletPage();
                await BaseUI.switchMenu(bot, chatId, messageId, title, button,);
            }
        } catch (error) {
            Red(`walletDeleteYesETH ====>  ${error}`);
        }
    },

    createNewWalletETH: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;

            const { publicKey, privateKey } = await createBaseWalletETH();
            const saveResult = await BaseWalletDBAccess.saveBaseWallet(userId, chatId, publicKey, privateKey);
            if (!saveResult) {
                console.log(`saveResult ====🚀 FAILED`);
            }

            const { title, button } = BaseWalletUI.createNewWalletPage(publicKey, privateKey);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`createNewWalletSOL ====>  ${error}`);
        }
    },

    createNewWalletBackETH: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;

            let currentPublicKey;

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
            Red(`createNewWalletBackETH ====>  ${error}`);
        }
    },

    importWalletETH: async (bot, queryData) => {
        try {

            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;

            await bot.sendMessage(chatId, `📨 Send wallet PK`);
            bot.once('message', async (newMsg) => {
                const importPrivateKey = newMsg.text;
                const validPrivateKey = await isValidBasePrivateKey(importPrivateKey);
                const privateKey = importPrivateKey;
                const existPrivateKey = await BaseWalletDBAccess.findBaseWallet(privateKey);

                if (!validPrivateKey) {
                    bot.sendMessage(chatId, 'Invalid token address!').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                    return;
                }
                else if (existPrivateKey) {
                    bot.sendMessage(chatId, 'Exist privateKey').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                    return;
                }
                else {
                    getBasePublicKeyFromPrivateKey
                    const importPublicKey = await getBasePublicKeyFromPrivateKey(importPrivateKey);
                    const saveResult = await BaseWalletDBAccess.saveBaseWallet(userId, chatId, importPublicKey, importPrivateKey);
                    if (!saveResult) {
                        console.log(`saveResult ====🚀 FAILED`);
                    }
                    else {
                        const { title, button } = BaseWalletUI.importNewWalletPage();
                        await BaseUI.switchMenu(bot, chatId, messageId, title, button,);
                    }
                }

            });
        } catch (error) {
            Red(`importWalletETH ====>  ${error}`);
        }
    },

    withdrawETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const data = queryData.data;
            const messageId = queryData.message?.message_id;

            const title = `
        📨 Provide wallet address below
            Currency : ETH
            Chain&Protocol : ETH (SPL)

            BE CAREFULL TO PROVIDE WALLET ADDRESS,
             CHECK IT TWICE
            IF YOU PROVIDE WRONG WALLET ADDRESS,
             YOU MAY LOSE YOUR FUNDS
            WE ARE NOT RESPONSIBLE FOR ANY LOSS OF FUNDS
            Chain and Protocol are important,
             please provide them correctly`;

            await bot.sendMessage(chatId, title);
            bot.once('message', async (newMsg) => {
                withdrawWalletAddress = newMsg.text;
                const validPublicKey = isValidBasePublicKey(withdrawWalletAddress)
                if (!validPublicKey) {
                    bot.sendMessage(chatId, 'Invalid wallet address!').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                }
                else {
                    const { title, button } = BaseWalletUI.withdrawAmountPage();
                    bot.sendMessage(chatId, title,
                        {
                            reply_markup: {
                                inline_keyboard: button
                            }
                        }
                    );
                }

            });
        } catch (error) {
            Red(`withdrawtETH ====>  ${error}`);
        }

    },

    withdrawAllETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const { title, button } = BaseWalletUI.withdrawAllConfirmYesPage();

            bot.sendMessage(chatId, title, {
                reply_markup: {
                    inline_keyboard: button
                },
                parse_mode: "HTML"
            });
        } catch (error) {
            Red(`withdrawAllETH ====>  ${error}`);
        }
    },

    withdrawAllYesETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            if (!withdrawWalletAddress) {
                bot.sendMessage(chatId, 'Find the withdraw to Wallet Address.').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
            }

            const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);

            const withdrawAllResult = await transferAllEth(findUserBaseWallet.privateKey, withdrawWalletAddress);
            if (withdrawAllResult) {
                bot.sendMessage(chatId, 'Withdraw All successful.').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
            }
        } catch (error) {
            Red(`withdrawAllYesETH ====>  ${error}`);
        }
    },

    withdrawAllNoETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            await bot.editMessageText('Withdraw Cancelled 🚫', { chat_id: chatId, message_id: messageId, reply_markup: null, disable_web_page_preview: true, parse_mode: 'HTML' }).then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
        } catch (error) {
            Red(`withdrawAllNoSOL ====>  ${error}`);
        }
    },

    withdrawCustomerAmountETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            await bot.sendMessage(chatId, `Enter amount to withdraw (% ETH)`);
            bot.once('message', async (newMsg) => {
                const withdrawAmount = newMsg.text;
                const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);
                if (Number(withdrawAmount) == withdrawAmount) {
                    const withdrawCosutomResult = await transferCustomerAmountEth(findUserBaseWallet.privateKey, withdrawWalletAddress, withdrawAmount / 100);
                    if (withdrawCosutomResult)
                        bot.sendMessage(chatId, `success`);
                }
                else {
                    bot.sendMessage(chatId, '🚫 Invalid amount, try again').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                }
            });
        } catch (error) {
            Red(`withdrawCustomerAmountSOL ====>  ${error}`);
        }
    },

    depositETH: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            const findUserBaseWallet = await BaseWalletDBAccess.findBaseWallet(chatId);

            const url = {
                deposit: `${depostUrl}${findUserBaseWallet.publicKey}`,
                ethscan: `${ethscanUrl}/${findUserBaseWallet.publicKey}`
            }

            const { title, button } = BaseDepositUI.depositPage(findUserBaseWallet.publicKey, url);
            await BaseUI.switchMenu(bot, chatId, messageId, title, button);
        } catch (error) {
            Red(`depositETH ====>  ${error}`);
        }
    }
}

module.exports = BaseWalletController;