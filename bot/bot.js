const chalk = require('chalk');
const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');
const StartController = require('../controller/startController');

const WalletController = require('../controller/walletController');
const PositionController = require('../controller/positionController');
const CopyTradingController = require('./../controller/copyTradingController');
const ReferralController = require('../controller/referralController');
const SettingController = require('../controller/settingController');
const BaseStartController = require('../controller/base/baseStartController');
const BaseWalletController = require('../controller/base/baseWalletController');
const BasePositionController = require('../controller/base/basePositionController');
const BaseCopyTradingController = require('../controller/base/baseCopyTradingController');
const BaseSettingController = require('../controller/base/baseSettingController');
const BaseReferralController = require('../controller/base/baseReferralController');
const WalletDBAccess = require('../db/wallet-db-access');
// const fetchTokenLaunchNews = require('../services/x-news');

dotenv.config();



const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
let chatId;
let userId;


const init = () => {
    bot.setMyCommands(
        [
            { command: 'start', description: 'Start copy trade bot' }
        ],
    ).catch((error) => {
        console.error('Error setting custom commands:', error);
    });

    bot.onText(/\/start(.*)/, startCommand);


    async function startCommand(msg, match) {
        chatId = msg.chat.id;
        userId = msg.chat.username;
        // fetchTokenLaunchNews(chatId); // Twitter API
        StartController.startCommand(bot, chatId, userId);
        const referralUser = await WalletDBAccess.findWallet(match[1]);
        console.log(`referralUser ====🚀`, referralUser);
        if (referralUser) {
            const addReferalUser = await WalletDBAccess.addReferalUser(match[1], { chatId, userId })
            const updateResult = await WalletDBAccess.findOneAndUpdateWallet(chatId, { referralWallet: referralUser.publicKey });
        }
    }

    bot.on('callback_query', (query) => {
        try {
            const callBackQuery = query.data;
            const userId = query.message.chat.username;
            console.log(`🚩  ${callBackQuery}[😎${userId}]`);

            if (callBackQuery === 'wallet' || callBackQuery === 'wallet_delete_no') {
                WalletController.wallet(bot, query);
            }
            if (callBackQuery === 'sol_network') {
                const chatId = query.message.chat.id;
                const userId = query.message.chat.username;
                StartController.startCommand(bot, chatId, userId)
            }
            else if (callBackQuery === 'wallet_delete') {
                WalletController.walletDeleteSOL(bot, query);
            }
            else if (callBackQuery === 'wallet_delete_yes') {
                WalletController.walletDeleteYesSOL(bot, query);
            }
            else if (callBackQuery === 'create_new_wallet') {
                WalletController.createNewWalletSOL(bot, query);
            }
            else if (callBackQuery === 'create_wallet_back' || callBackQuery === 'wallet_back') {
                WalletController.createNewWalletBackSOL(bot, query);
            }
            else if (callBackQuery === 'import_wallet') {
                WalletController.importWalletSOL(bot, query);
            }
            else if (callBackQuery === 'back') {
                StartController.back(bot, query);
            }
            else if (callBackQuery === 'withdraw') {
                WalletController.withdrawSOL(bot, query);
            }
            else if (callBackQuery === 'withdraw_all') {
                WalletController.withdrawAllSOL(bot, query);
            }
            else if (callBackQuery === 'withdraw_all_yes') {
                WalletController.withdrawAllYesSOL(bot, query);
            }
            else if (callBackQuery === 'withdraw_all_no') {
                WalletController.withdrawAllNoSOL(bot, query);
            }
            else if (callBackQuery === 'customer_amount') {
                WalletController.withdrawCustomerAmountSOL(bot, query);
            }
            else if (callBackQuery === 'deposit') {
                WalletController.depositSOL(bot, query);
            }
            else if (callBackQuery === 'position') {
                PositionController.positionSOL(bot, query);
            }
            else if (callBackQuery === 'my_tokens') {
                PositionController.positionMyTokenSOL(bot, query);
            }
            else if (callBackQuery.includes('my_token_prev-')) {
                if (callBackQuery.length >= 16) {
                    return
                } else {
                    PositionController.positionMyTokenSOL(bot, query, Number(callBackQuery.slice(-1)));
                }
            }
            else if (callBackQuery.includes('my_token_next-')) {
                PositionController.positionMyTokenSOL(bot, query, Number(callBackQuery.slice(-1)));
            }
            else if (callBackQuery === 'token_buy') {
                PositionController.positionTokenBuySOL(bot, query);
            }
            else if (callBackQuery === 'sell_manage_page') {
                PositionController.positionSellAndManageSOL(bot, query);
            }
            else if (callBackQuery.includes('my_token_sell_prev-')) {
                if (callBackQuery.length >= 21) {
                    return
                } else {
                    PositionController.positionSellAndManageSOL(bot, query, Number(callBackQuery.slice(-1)));
                }
            }
            else if (callBackQuery.includes('my_token_sell_next-')) {
                PositionController.positionSellAndManageSOL(bot, query, Number(callBackQuery.slice(-1)));
            }
            else if (callBackQuery.includes('current_token_buy_')) {
                PositionController.positionCurrentTokenBuySOL(bot, query, callBackQuery.slice(18, callBackQuery.length));
            }
            else if (callBackQuery.includes('current_token_sell_')) {
                PositionController.positionCurrentTokenSellSOL(bot, query, callBackQuery.slice(19, callBackQuery.length));
            }
            else if (callBackQuery.slice(0, 5) == 'burn_') {
                PositionController.positionCurrentTokenBurnSOL(bot, query, callBackQuery.slice(5, callBackQuery.length));
            }
            else if (callBackQuery.includes('token_burn_yes_')) {
                PositionController.positionCurrentTokenBurnYesSOL(bot, query, callBackQuery.slice(15, callBackQuery.length));
            }
            else if (callBackQuery === 'token_burn_no') {
                PositionController.positionCurrentTokenBurnNoSOL(bot, query);
            }
            else if (callBackQuery === 'my_trades') {
                PositionController.positionMyTradePageSOL(bot, query);
            }
            else if (callBackQuery.includes('my_trade_result_prev-')) {
                if (Number(callBackQuery.slice(21, callBackQuery.length)) < 0) {
                    return
                } else {
                    PositionController.positionMyTradePageSOL(bot, query, Number(callBackQuery.slice(21, callBackQuery.length)));
                }
            }
            else if (callBackQuery.includes('my_trade_result_next-')) {
                PositionController.positionMyTradePageSOL(bot, query, Number(callBackQuery.slice(21, callBackQuery.length)));
            }
            else if (callBackQuery === 'position_back') {
                PositionController.positionBackPageSOL(bot, query);
            }
            else if (callBackQuery === 'copy_trading' || callBackQuery === 'copy_trading_page_back') {
                CopyTradingController.copyTradingPageSOL(bot, query);
            }
            else if (callBackQuery === 'add_new_whale_address') {
                CopyTradingController.copyTradingAddNewWalletPageSOL(bot, query);
            }
            else if (callBackQuery.includes(`whale_page_`)) {
                CopyTradingController.copyTradingWhaleWalletPageSOL(bot, query, callBackQuery.slice(11, callBackQuery.length));
            }
            else if (callBackQuery.includes(`delete_whale_wallet_`)) {
                CopyTradingController.copyTradingDeleteWhaleWalletPageSOL(bot, query, callBackQuery.slice(20, callBackQuery.length));
            }
            else if (callBackQuery.includes(`copytrade_`)) {
                CopyTradingController.copyTradingStartAndStopPageSOL(bot, query, callBackQuery.slice(10, callBackQuery.length));
            }
            else if (callBackQuery === `referral`) {
                ReferralController.referralPage(bot, query);
            }
            else if (callBackQuery === `set_wallet_commission`) {
                ReferralController.setWalletForCommission(bot, query);
            }
            else if (callBackQuery === `setting`) {
                SettingController.settingPage(bot, query);
            }
            else if (callBackQuery === `buy_amount`) {
                SettingController.settingBuyAmountPage(bot, query);
            }
            else if (callBackQuery === `edit_slippage`) {
                SettingController.settingEditSlippagePage(bot, query);
            }
            else if (callBackQuery === `edit_jitoTip`) {
                SettingController.settingEditJitoTipPage(bot, query);
            }
            else if (callBackQuery === `sell_type_all`) {
                SettingController.settingSellTypeAllPage(bot, query);
            }
            else if (callBackQuery === `sell_type_persent`) {
                SettingController.settingSellTypePercentPage(bot, query);
            }
            else if (callBackQuery === `edit_stop_loss`) {
                SettingController.settingEditStopLossPage(bot, query);
            }
            else if (callBackQuery === `edit_take_profit`) {
                SettingController.settingEditTakeProfitPage(bot, query);
            }



            else if (callBackQuery === `base_network` || callBackQuery === `base_back` || callBackQuery === 'base_wallet_back') {
                BaseStartController.baseStartCommand(bot, query);
            }
            else if (callBackQuery === 'base_wallet' || callBackQuery === `base_wallet_delete_no`) {
                BaseWalletController.baseWallet(bot, query);
            }
            else if (callBackQuery === 'base_wallet_delete') {
                BaseWalletController.baseWalletDeleteETH(bot, query);
            }
            else if (callBackQuery === 'base_wallet_delete_yes') {
                BaseWalletController.walletDeleteYesETH(bot, query);
            }
            else if (callBackQuery === 'base_create_new_wallet') {
                BaseWalletController.createNewWalletETH(bot, query);
            }
            else if (callBackQuery === 'base_create_new_wallet_back') {
                BaseWalletController.createNewWalletBackETH(bot, query);
            }
            else if (callBackQuery === 'base_import_wallet') {
                BaseWalletController.importWalletETH(bot, query);
            }
            else if (callBackQuery === 'base_withdraw') {
                BaseWalletController.withdrawETH(bot, query);
            }
            else if (callBackQuery === 'base_withdraw_all') {
                BaseWalletController.withdrawAllETH(bot, query);
            }
            else if (callBackQuery === 'base_withdraw_all_yes') {
                BaseWalletController.withdrawAllYesETH(bot, query);
            }
            else if (callBackQuery === 'base_withdraw_all_no') {
                BaseWalletController.withdrawAllNoETH(bot, query);
            }
            else if (callBackQuery === 'base_customer_amount') {
                BaseWalletController.withdrawCustomerAmountETH(bot, query);
            }
            else if (callBackQuery === 'base_deposit') {
                BaseWalletController.depositETH(bot, query);
            }
            else if (callBackQuery === 'base_position' || callBackQuery === `base_position_back`) {
                BasePositionController.positionETH(bot, query);
            }
            else if (callBackQuery === 'base_my_tokens') {
                BasePositionController.positionMyTokenETH(bot, query);
            }


            else if (callBackQuery.includes('my_base_token_prev-')) {
                if (Number(callBackQuery.slice(20, callBackQuery.length)) < 0) {
                    return
                } else {
                    BasePositionController.positionMyTokenETH(bot, query, Number(callBackQuery.slice(20, callBackQuery.length)));
                }
            }
            else if (callBackQuery.includes('my_base_token_next-')) {
                console.log(`callBackQuery.slice(20, callBackQuery.length) ====🚀`, callBackQuery.slice(19, callBackQuery.length));

                BasePositionController.positionMyTokenETH(bot, query, Number(callBackQuery.slice(20, callBackQuery.length)));
            }


            else if (callBackQuery === 'base_buy_token') {
                BasePositionController.positionTokenBuyETH(bot, query);
            }
            else if (callBackQuery === 'base_sell_token') {
                BasePositionController.positionTokenSellETH(bot, query);
            }
            else if (callBackQuery === 'base_sell_manage_page') {
                BasePositionController.positionSellAndManageETH(bot, query);
            }
            else if (callBackQuery.includes('current_base_token_buy_')) {
                BasePositionController.positionCurrentTokenBuyETH(bot, query, callBackQuery.slice(23, callBackQuery.length));
            }
            else if (callBackQuery.includes('current_base_token_sell_')) {
                BasePositionController.positionCurrentTokenSellETH(bot, query, callBackQuery.slice(24, callBackQuery.length));
            }
            // else if (callBackQuery === 'token_base_burn_no') {
            //     BasePositionController.positionCurrentTokenBurnNoETH(bot, query);
            // }
            // else if (callBackQuery === 'token_base_burn_no') {
            //     BasePositionController.positionCurrentTokenBurnNoETH(bot, query);
            // }
            else if (callBackQuery === 'base_my_trades') {
                BasePositionController.positionMyTradePageETH(bot, query);
            }
            else if (callBackQuery.includes('my_base_trade_result_prev-')) {
                if (Number(callBackQuery.slice(21, callBackQuery.length)) < 0) {
                    return
                } else {
                    BasePositionController.positionMyTradePageETH(bot, query, Number(callBackQuery.slice(26, callBackQuery.length)));
                }
            }
            else if (callBackQuery.includes('my_base_trade_result_next-')) {
                BasePositionController.positionMyTradePageETH(bot, query, Number(callBackQuery.slice(26, callBackQuery.length)));
            }
            else if (callBackQuery === 'base_copy_trading' || callBackQuery === `base_copy_trading_page_back`) {
                BaseCopyTradingController.copyTradingPageETH(bot, query, Number(callBackQuery.slice(26, callBackQuery.length)));
            }
            else if (callBackQuery === 'add_new_base_whale_address') {
                BaseCopyTradingController.copyTradingAddNewWalletPageETH(bot, query);
            }
            else if (callBackQuery.includes(`whale_base_page_`)) {
                BaseCopyTradingController.copyTradingWhaleWalletPageETH(bot, query, callBackQuery.slice(16, callBackQuery.length));
            }
            else if (callBackQuery.includes(`del_base_w_wallet_`)) {
                BaseCopyTradingController.copyTradingDeleteWhaleWalletPageETH(bot, query, callBackQuery.slice(18, callBackQuery.length));
            }
            else if (callBackQuery.includes(`copy_base_`)) {
                BaseCopyTradingController.copyTradingStartAndStopPageETH(bot, query, callBackQuery.slice(10, callBackQuery.length));
            }
            else if (callBackQuery === `base_setting`) {
                BaseSettingController.settingPageETH(bot, query);
            }
            else if (callBackQuery === `base_buy_amount`) {
                BaseSettingController.settingBuyAmountPageETH(bot, query);
            }
            else if (callBackQuery === `base_edit_slippage`) {
                BaseSettingController.settingEditSlippagePageETH(bot, query);
            }
            else if (callBackQuery === `base_sell_type_all`) {
                BaseSettingController.settingSellTypeAllPageETH(bot, query);
            }
            else if (callBackQuery === `base_sell_type_persent`) {
                BaseSettingController.settingSellTypePercentPageETH(bot, query);
            }
            else if (callBackQuery === `base_edit_stop_loss`) {
                BaseSettingController.settingEditStopLossPageETH(bot, query);
            }
            else if (callBackQuery === `base_edit_take_profit`) {
                BaseSettingController.settingEditTakeProfitPageETH(bot, query);
            }
            else if (callBackQuery === `base_referral`) {
                BaseReferralController.referralPage(bot, query);
            }
            else if (callBackQuery === `base_set_wallet_commission`) {
                BaseReferralController.setWalletForCommission(bot, query);
            }





        } catch (error) {
            console.log(error)
        }
    });

}

module.exports = init;