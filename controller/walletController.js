const WalletDBAccess = require("../db/wallet-db-access");
const { isValidPublicKeySOL, getSolBalanceSOL, withdrawAllSOL, getKeypairfromPirvaetKeySOL, createWalletSOL, getPublicKeyFromPrivateKeySOL, isValidPrivateKeySOL } = require("../services/solana");
const WalletUI = require('./../ui/walletUI');
const chalk = require("chalk");
const axios = require('axios');
const UI = require("../ui");
const DepositUI = require("../ui/depositUI");


let depostUrl = `https://buy.moonpay.io/?apiKey=pk_live_TBeEWwlvSTuyxLSueHu3dINixf4LEt&currencyCode=SOL&walletAddress=`;
let solscanUrl = `https://solscan.io/account/`;

const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

let withdrawWalletAddress;

const WalletController = {
    wallet: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            const data = queryData.data;
            const messageId = queryData.message?.message_id;

            if (!data) {
                console.log('no queryData.data');
                return;
            }
            const url = {
                deposit: `${depostUrl}${findUserWallet.publicKey}`,
                solscan: `${solscanUrl}/${findUserWallet.publicKey}`
            }
            const { title, button } = WalletUI.walletPage(findUserWallet.publicKey, findUserWallet.privateKey, url);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`wallet ====>  ${error}`);
        }
    },

    walletDeleteSOL: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            const { title, button } = WalletUI.deleteWalletPage(findUserWallet.publicKey);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`walletDeleteSOL ====>  ${error}`);
        }
    },

    walletDeleteYesSOL: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            const deleteWalletResult = await WalletDBAccess.deleteWallet(chatId);
            if (deleteWalletResult) {
                const { title, button } = WalletUI.createAndImportWalletPage();
                await UI.switchMenu(bot, chatId, messageId, title, button,);
            }
        } catch (error) {
            Red(`walletDeleteYesSOL ====>  ${error}`);
        }
    },

    createNewWalletSOL: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;

            const { publicKey, privateKey } = await createWalletSOL();
            const saveResult = await WalletDBAccess.saveWallet(userId, chatId, publicKey, privateKey);

            if (!saveResult) {
                console.log(`saveResult ====🚀 FAILED`);
            }
            const { title, button } = WalletUI.createNewWalletPage(publicKey, privateKey);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`createNewWalletSOL ====>  ${error}`);
        }
    },

    createNewWalletBackSOL: async (bot, queryData) => {
        try {
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;

            let currentPublicKey;

            const findUserWallet = await WalletDBAccess.findWallet(chatId);

            if (!findUserWallet) {
                const { publicKey, privateKey } = await createWalletSOL();
                currentPublicKey = publicKey;
                const saveResult = await WalletDBAccess.saveWallet(userId, chatId, publicKey, privateKey);
                if (!saveResult) {
                    console.log(`saveResult ====🚀 FAILED`);
                }
            }
            const getMyWalletBalance = await getSolBalanceSOL(findUserWallet.publicKey);
            const currentSOLUSD = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);


            const { title, button } = UI.landingPage(getMyWalletBalance, currentSOLUSD.data.solana.usd);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`createNewWalletBackSOL ====>  ${error}`);
        }
    },

    importWalletSOL: async (bot, queryData) => {
        try {

            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;
            const userId = queryData.message.chat.username;

            await bot.sendMessage(chatId, `📨 Send wallet PK`);
            bot.once('message', async (newMsg) => {
                const importPrivateKey = newMsg.text;
                const validPrivateKey = await isValidPrivateKeySOL(importPrivateKey);
                if (!validPrivateKey) {
                    bot.sendMessage(chatId, 'Invalid token address!').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                }
                else {
                    const importPublicKey = await getPublicKeyFromPrivateKeySOL(importPrivateKey);
                    const saveResult = await WalletDBAccess.saveWallet(userId, chatId, importPublicKey, importPrivateKey);
                    if (!saveResult) {
                        Red(`save Error.`);
                    }
                    const { title, button } = WalletUI.importNewWalletPage();
                    await UI.switchMenu(bot, chatId, messageId, title, button,);
                }

            });
        } catch (error) {
            Red(`importWalletSOL ====>  ${error}`);
        }
    },

    withdrawSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const data = queryData.data;
            const messageId = queryData.message?.message_id;

            if (!data) {
                console.log('no queryData.data');
                return;
            }
            const title = `
        📨 Provide wallet address below
            Currency : SOL
            Chain&Protocol : SOL (SPL)

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
                const validPublicKey = await isValidPublicKeySOL(withdrawWalletAddress)
                if (!validPublicKey) {
                    bot.sendMessage(chatId, 'Invalid wallet address!').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                }
                else {
                    const { title, button } = WalletUI.withdrawAmountPage();
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
            Red(`withdrawtSOL ====>  ${error}`);
        }

    },

    withdrawAllSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const chatId = queryData.message.chat.id;
            const { title, button } = WalletUI.withdrawAllConfirmYesPage(withdrawWalletAddress);

            bot.sendMessage(chatId, title, {
                reply_markup: {
                    inline_keyboard: button
                }
            });
        } catch (error) {
            Red(`withdrawAllSOL ====>  ${error}`);
        }
    },

    withdrawAllYesSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }

            const chatId = queryData.message.chat.id;
            if (!withdrawWalletAddress) {
                bot.sendMessage(chatId, 'Find the withdraw to Wallet Address.').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
            }

            const findUserWallet = await WalletDBAccess.findWallet(chatId);
            const signer = await getKeypairfromPirvaetKeySOL(findUserWallet.privateKey);
            const amount = await getSolBalanceSOL(findUserWallet.publicKey);

            const withdrawAllResult = await withdrawAllSOL(findUserWallet.publicKey, withdrawWalletAddress, signer, amount);
            if (withdrawAllResult) {
                bot.sendMessage(chatId, 'Withdraw All successful.').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
            }
        } catch (error) {
            Red(`withdrawAllYesSOL ====>  ${error}`);
        }
    },

    withdrawAllNoSOL: async (bot, queryData) => {
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

    withdrawCustomerAmountSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            await bot.sendMessage(chatId, `Enter amount to withdraw`);
            bot.once('message', async (newMsg) => {
                const withdrawAmount = newMsg.text;
                const findUserWallet = await WalletDBAccess.findWallet(chatId);
                const amount = await getSolBalanceSOL(findUserWallet.publicKey);
                if (Number(withdrawAmount) == withdrawAmount && amount > withdrawAmount) {
                    const signer = await getKeypairfromPirvaetKeySOL(findUserWallet.privateKey);
                    White(`${findUserWallet.publicKey}, ${withdrawWalletAddress}, ${signer}, ${withdrawAmount}`)
                    const withdrawCosutomResult = await withdrawAllSOL(findUserWallet.publicKey, withdrawWalletAddress, signer, withdrawAmount);
                    if (withdrawCosutomResult)
                        bot.sendMessage(chatId, `success`);
                }
                else if (Number(withdrawAmount) != withdrawAmount) {
                    bot.sendMessage(chatId, '🚫 Invalid amount, try again').then((msg) => { setTimeout(() => { bot.deleteMessage(chatId, msg.message_id) }, 3000) });
                }
                else if (amount < withdrawAmount) {
                    bot.sendMessage(chatId, `Amount cannot be greater than wallet balance, write less than <code>${amount}</code>, or <code>/start</code> to cancel`);
                }
            });
        } catch (error) {
            Red(`withdrawCustomerAmountSOL ====>  ${error}`);
        }
    },

    depositSOL: async (bot, queryData) => {
        try {
            if (!queryData.message) {
                console.log('no queryData.message');
                return;
            }
            const messageId = queryData.message?.message_id;
            const chatId = queryData.message.chat.id;

            const findUserWallet = await WalletDBAccess.findWallet(chatId);

            const url = {
                deposit: `${depostUrl}${findUserWallet.publicKey}`,
                solscan: `${solscanUrl}/${findUserWallet.publicKey}`
            }

            const { title, button } = DepositUI.depositPage(findUserWallet.publicKey, url);
            await UI.switchMenu(bot, chatId, messageId, title, button,);
        } catch (error) {
            Red(`depositSOL ====>  ${error}`);
        }
    }
}

module.exports = WalletController;