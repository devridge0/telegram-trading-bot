const BaseSettingUI = {
    settingPage: (data) => {
        const title = `⚙️ SETTINGS: Select an option`

        const button = [
            [
                { text: `Edit buy amount - (${data.buyAmount} ETH)📝`, callback_data: `base_buy_amount` }
            ],
            [
                { text: `Edit Slippage - (${data.slippage}%)📝`, callback_data: `base_edit_slippage` }
            ],
            // [
            //     { text: `Edit Jito Tip - (${data.jitoTip})📝`, callback_data: `edit_jitoTip` }
            // ],
            [
                { text: `Sell ALL${data.selltype == 'all' ? '🟢' : '🔴'}`, callback_data: `base_sell_type_all` },
                { text: `Sell PERCENTAGE${data.selltype != 'all' ? '🟢' : '🔴'}`, callback_data: `base_sell_type_persent` }
            ],
            [
                { text: `Edit stop loss - ${data.stopLoss}%📝`, callback_data: `base_edit_stop_loss` },
                { text: `Edit take profit - ${data.takeProfit}%📝`, callback_data: `base_edit_take_profit` }
            ],
            [
                { text: `Back 🔙`, callback_data: `base_back` }
            ]

        ];

        return { title, button };
    },

}

module.exports = BaseSettingUI;