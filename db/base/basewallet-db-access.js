const BaseCopyTradingHistory = require("../../models/base/baseCopyTradingHistory");
const BaseTargetWallet = require("../../models/base/baseTargetWallet");
const BaseWallet = require("../../models/base/baseWallet");
const BaseAdminWallet = require('./../../models/base/adminWallet');

const chalk = require('chalk');

const Red = (str) => console.log(chalk.red.bold(str));


const BaseWalletDBAccess = {

    saveAdminWallet: async (adminWallet) => {
        try {
            await BaseAdminWallet.create({ adminWallet });
            return true;
        } catch (error) {
            Red(`saveWallet ====🚀${error}`);
            return false;
        }
    },

    findBaseWallet: async (chatId) => {
        try {
            let wallet = await BaseWallet.find({ chatId });
            if (wallet.length > 0) {
                return wallet[0];
            } else {
                return false;
            }
        } catch (error) {
            Red(`findBaseWallet ====🚀${error}`);
        }
    },

    deleteBaseWallet: async (chatId) => {
        try {
            await BaseWallet.deleteOne({ chatId });
            return true;
        } catch (error) {
            Red(`deleteBaseWallet ====🚀${error}`);
        }
    },

    saveBaseWallet: async (userId, chatId, publicKey, privateKey) => {
        try {

            const newWalletInfo = {
                userId: userId,
                chatId: chatId,
                publicKey: publicKey,
                privateKey: privateKey,
                referralWallet: publicKey,
            }
            await BaseWallet.create(newWalletInfo);
            return true;
        } catch (error) {
            Red(`saveWallet ====🚀${error}`);
            return false;
        }
    },

    findOneAndUpdateBaseWallet: async (chatId, changeInfo) => {
        try {
            await BaseWallet.findOneAndUpdate({ chatId }, changeInfo);
            return true;
        } catch (error) {
            Red(`saveWallet ====🚀${error}`);
            return false;
        }
    },

    saveBaseTargetWallet: async (chatId, address, name) => {
        try {
            const newWalletInfo = {
                chatId: chatId,
                address: address,
                name: name
            }
            await BaseTargetWallet.create(newWalletInfo);
            return true;
        } catch (error) {
            Red(`saveBaseTargetWallet ====🚀${error}`);
            return false;
        }
    },

    findBaseTargetWallet: async (chatId, address) => {
        try {
            let wallet = await BaseTargetWallet.find({ chatId, address });
            if (wallet.length > 0) {
                return wallet[0];
            } else {
                return false;
            }
        } catch (error) {
            Red(`findBaseTargetWallet ====🚀${error}`);
        }
    },

    findBaseAllTargetWallet: async (chatId) => {
        try {
            let wallet = await BaseTargetWallet.find({ chatId });
            if (wallet.length > 0) {
                return wallet;
            } else {
                return false;
            }
        } catch (error) {
            Red(`findAllTargetWallet ====🚀${error}`);
        }
    },

    deleteBaseTargetWallet: async (chatId, address) => {
        try {
            await BaseTargetWallet.deleteOne({ chatId, address });
            return true;
        } catch (error) {
            Red(`deleteTargetWallet ====🚀${error}`);
        }
    },

    statusUpdateBaseTargetWallet: async (chatId, address, status) => {
        try {
            if (status === `true`) {
                status = `false`;
            }
            else if (status === `false`) status = `true`;
            await BaseTargetWallet.findOneAndUpdate({ address, chatId }, { status: status });
        } catch (error) {
            Red(`statusUpdateBaseTargetWallet ====🚀${error}`);
        }
    },

    // saveCopyTradingHistory: async (userId, chatId, sendToken, receiveToken, myWallet, whaleWallet) => {
    //     try {
    //         const newTradingInfo = {
    //             userId: userId,
    //             chatId: chatId,
    //             sendToken: sendToken,
    //             receiveToken: receiveToken,
    //             myWallet: myWallet,
    //             whaleWallet: whaleWallet,
    //         }
    //         await CopyTradingHistory.create(newTradingInfo);
    //         return true;
    //     } catch (error) {
    //         Red(`saveCopyTradingHistory ====🚀${error}`);
    //         return false;
    //     }
    // },

    findBaseCopyTradingHistory: async (chatId) => {
        try {
            let result = await BaseCopyTradingHistory.find({ chatId });
            if (result.length > 0) {
                return result;
            } else {
                return false;
            }
        } catch (error) {
            Red(`findBaseCopyTradingHistory ====🚀${error}`);
        }
    },

}

module.exports = BaseWalletDBAccess;
