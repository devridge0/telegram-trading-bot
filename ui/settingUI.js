const SettingUI = {
    settingPage: (data) => {
        const title = `⚙️ SETTINGS: Select an option`

        const button = [
            [
                { text: `Edit buy amount - (${data.buyAmount} SOL)📝`, callback_data: `buy_amount` }
            ],
            [
                { text: `Edit Slippage - (${data.slippage}%)📝`, callback_data: `edit_slippage` }
            ],
            [
                { text: `Sell ALL${data.selltype == 'all' ? '🟢' : '🔴'}`, callback_data: `sell_type_all` },
                { text: `Sell PERCENTAGE${data.selltype != 'all' ? '🟢' : '🔴'}`, callback_data: `sell_type_persent` }
            ],
            [
                { text: `Edit stop loss - ${data.stopLoss}%📝`, callback_data: `edit_stop_loss` },
                { text: `Edit take profit - ${data.takeProfit}%📝`, callback_data: `edit_take_profit` }
            ],
            [
                { text: `Back 🔙`, callback_data: `back` }
            ]

        ];

        return { title, button };
    },

}

module.exports = SettingUI;