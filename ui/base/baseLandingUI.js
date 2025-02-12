const BaseUI = {
    switchMenu: async (bot, chatId, messageId, title, buttons) => {
        const keyboard = {
            inline_keyboard: buttons,
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true
        };

        try {
            await bot.editMessageText(title, { chat_id: chatId, message_id: messageId, reply_markup: keyboard, disable_web_page_preview: true, parse_mode: 'HTML' })
        } catch (error) {
            console.log(error)
        }
    },
    landingPage: (balance, usd) => {
        const title = `🦸 Welcome To My revenger Bot🤖. \n\ My bot allows you to track the investments of the biggest crypto whales on the Ethereum and Solana networks. 🐳. \n ____________________________________________________ \n 💡 If you aren't already, we advise that you create or import wallets`
        const button = [
            [
                { text: `SOL🔴`, callback_data: `sol_network` },
                { text: `BASE🟢`, callback_data: `base_network` }
            ],
            [
                { text: `Wallet : ${balance.toFixed(6)} ETH ~ $${(balance * usd).toFixed(2)} 💰`, callback_data: `base_wallet` }
            ],
            [
                { text: `Deposit 💵`, callback_data: `base_deposit` }
            ],
            [
                { text: `Position📈`, callback_data: `base_position` },
                { text: `Copy trading🤖`, callback_data: `base_copy_trading` }
            ],
            [
                { text: `Referral🎁`, callback_data: `base_referral` },
                { text: `Setting⚙️`, callback_data: `base_setting` }
            ],
            [
                { text: `Community Channel💬`, callback_data: `community-channel` , url: `https://t.me/tonyindxb`}
            ],
            [
                { text: `Results💰`, callback_data: `results` ,url : `https://t.me/+IPs6wqmaGWhjyjNk`}
            ],
            [
                { text: `Refresh♻️`, callback_data: `refresh` }
            ]
        ];

        return { title, button };
    },
}

module.exports = BaseUI;