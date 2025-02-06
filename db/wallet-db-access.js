const CopyTradingHistory = require("../models/copyTradingHistory");
const Wallet = require("../models/Wallet");
const TargetWallet = require('./../models/targetWallet');
const chalk = require('chalk');

const Red = (str) => console.log(chalk.red.bold(str));


const WalletDBAccess = {
    findWallet: async (chatId) => {
        try {
            let wallet = await Wallet.find({ chatId });
            if (wallet.length > 0) {
                return wallet[0];
            } else {
                return false;
            }
        } catch (error) {
            Red(`findWallet ====🚀${error}`);
        }
    },

    deleteWallet: async (chatId) => {
        try {
            await Wallet.deleteOne({ chatId });
            return true;
        } catch (error) {
            Red(`deleteWallet ====🚀${error}`);
        }
    },

    saveWallet: async (userId, chatId, publicKey, privateKey) => {
        try {

            const newWalletInfo = {
                userId: userId,
                chatId: chatId,
                publicKey: publicKey,
                privateKey: privateKey,
                referralWallet: publicKey,
            }
            console.log(`userId, chatId,publicKey,privaetKey,username ====🚀`, JSON.stringify(newWalletInfo));
            await Wallet.create(newWalletInfo);
            return true;
        } catch (error) {
            Red(`saveWallet ====🚀${error}`);
            return false;
        }
    },

    findOneAndUpdateWallet: async (chatId, changeInfo) => {
        try {
            await Wallet.findOneAndUpdate({ chatId }, changeInfo);
            return true;
        } catch (error) {
            Red(`saveWallet ====🚀${error}`);
            return false;
        }
    },

    saveTargetWallet: async (chatId, address, name) => {
        try {
            const newWalletInfo = {
                chatId: chatId,
                address: address,
                name: name
            }
            await TargetWallet.create(newWalletInfo);
            return true;
        } catch (error) {
            Red(`saveTargetWallet ====🚀${error}`);
            return false;
        }
    },

    findTargetWallet: async (chatId, address) => {
        try {
            let wallet = await TargetWallet.find({ chatId, address });
            if (wallet.length > 0) {
                return wallet[0];
            } else {
                return false;
            }
        } catch (error) {
            Red(`findTargetWallet ====🚀${error}`);
        }
    },

    findAllSubscribersTargetWallet: async () => {
        try {
            let wallet = await TargetWallet.find({});
            if (wallet.length > 0) {
                return wallet;
            } else {
                return false;
            }
        } catch (error) {
            Red(`findAllSubscribersTargetWallet ====🚀${error}`);
        }
    },

    findAllTargetWallet: async (chatId) => {
        try {
            let wallet = await TargetWallet.find({ chatId });
            if (wallet.length > 0) {
                return wallet;
            } else {
                return false;
            }
        } catch (error) {
            Red(`findAllTargetWallet ====🚀${error}`);
        }
    },

    deleteTargetWallet: async (chatId, address) => {
        try {
            await TargetWallet.deleteOne({ chatId, address });
            return true;
        } catch (error) {
            Red(`deleteTargetWallet ====🚀${error}`);
        }
    },

    statusUpdateTargetWallet: async (chatId, address, status) => {
        try {
            if (status === `true`) {
                status = `false`;
            }
            else if (status === `false`) status = `true`;
            await TargetWallet.findOneAndUpdate({ address, chatId }, { status: status });
        } catch (error) {
            Red(`statusUpdateTargetWallet ====🚀${error}`);
        }
    },

    saveCopyTradingHistory: async (userId, chatId, sendToken, receiveToken, myWallet, whaleWallet) => {
        try {
            const newTradingInfo = {
                userId: userId,
                chatId: chatId,
                sendToken: sendToken,
                receiveToken: receiveToken,
                myWallet: myWallet,
                whaleWallet: whaleWallet,
            }
            await CopyTradingHistory.create(newTradingInfo);
            return true;
        } catch (error) {
            Red(`saveCopyTradingHistory ====🚀${error}`);
            return false;
        }
    },

    findCopyTradingHistory: async (chatId) => {
        try {
            let result = await CopyTradingHistory.find({ chatId });
            if (result.length > 0) {
                return result;
            } else {
                return false;
            }
        } catch (error) {
            Red(`findCopyTradingHistory ====🚀${error}`);
        }
    },

}

module.exports = WalletDBAccess;
