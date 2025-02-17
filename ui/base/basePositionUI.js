const BasePositionUI = {
    depositPage: () => {
        const title = `
        Check your tokens & trade positions 📈
        `;
        const button = [
            [
                { text: `Buy`, callback_data: `base_buy_token` },
                { text: `Sell`, callback_data: `base_sell_token` }
            ],
            [
                // { text: `My Tokens 💰`, callback_data: `base_my_tokens` },
                { text: `My Trades 📊`, callback_data: `base_my_trades` }
            ],
            // [
            //     { text: `Trade Config⚙️`, callback_data: `base_trade_config` }
            // ],
            [
                { text: `Back 🔙`, callback_data: `base_back` }
            ]
        ];
        return { title, button };
    },

    myTokensPage: (token, currentPageNumber) => {
        console.log(`currentPageNumber ====🚀`, currentPageNumber);

        const title = `Click token to start selling

<a href="https://t.me/eclipseiobot?start=sm-${token.mint}">${token.name}</a>
Amount/Price/Value:     <code>${token.amount}</code> / $<code>${Number(token.price).toFixed(3)}</code> / $<code>${(Number(token.price) * token.amount).toFixed(2)}</code>

Current page ${currentPageNumber + 1} pages`

        const button = [
            [
                { text: `Buy 🎯`, callback_data: `base_token_buy` },
                { text: `Sell & Manage 🛠`, callback_data: `base_sell_manage_page` }
            ],
            [
                { text: `Prev`, callback_data: `my_base_token_prev-${currentPageNumber - 1}` },
                { text: `${currentPageNumber + 1}`, callback_data: `page_number` },
                { text: `Next`, callback_data: `my_base_token_next-${currentPageNumber + 1}` }
            ],
            [
                { text: `Refresh♻️`, callback_data: `refresh_${token.name}` }
            ],
            [
                { text: `Back 🔙`, callback_data: `base_position_back` }
            ]
        ];

        return { title, button };
    },

    myTokensEmptyPage: () => {
        const title = ` 🚫You have no tokens.`;
        const button = [
            [
                { text: `Buy 🎯`, callback_data: `token_buy` },
                { text: `Sell & Manage 🛠`, callback_data: `sell_manage_page` }
            ],
            [
                { text: `Prev`, callback_data: `my_token_prev_empty` },
                { text: `0`, callback_data: `page_number` },
                { text: `Next`, callback_data: `my_token_next_empty` }
            ],
            // [
            //     { text: `Refresh♻️`, callback_data: `refresh_` }
            // ],
            [
                { text: `Back 🔙`, callback_data: `base_position_back` }
            ]
        ];

        return { title, button };
    },

    myTokensBuyAndSellPage: (token, currentPageNumber) => {
        const title = `🪙Coin:              ${token.name}
📊Amount:       ${token.amount}
📈Price:            ${Number(token.price)}$
📊Value:            ${(token.amount * Number(token.price)).toFixed(2)}$
👇 Token Address 👇
<code>${token.mint}</code>
Check the token on  <a href="https://dexscreener.com/solana/${token.mint}" >DexScreener</a>

Current page ${currentPageNumber + 1} pages`;
        const button = [
            [
                { text: `Buy X SOL`, callback_data: `current_base_token_buy_${token.mint}` },
                { text: `Sell X %`, callback_data: `current_base_token_sell_${token.mint}` }
            ],
            [
                { text: `Prev`, callback_data: `my_base_token_sell_prev-${currentPageNumber - 1}` },
                { text: `${currentPageNumber + 1}`, callback_data: `page_number` },
                { text: `Next`, callback_data: `my_base_token_sell_next-${currentPageNumber + 1}` }
            ],
            [
                { text: `Burn 🔥`, callback_data: `base_burn_${token.mint}` }
            ],
            [
                { text: `Back 🔙`, callback_data: `base_position_back` }
            ]
        ];

        return { title, button };
    },
    myTokensBurnPage: (currentAmount, tokenAddress) => {
        const title = `If you confirm you will lose your tokens and claim ${currentAmount} ETH
Your burn transaction will be processed at the slowest speed, we don’t want to burn big transaction fee money.
Click “Yes” or “No” below to confirm your burn ⬇️`;
        const button = [
            [
                { text: `Yes✅`, callback_data: `token_base_burn_yes_${tokenAddress}` },
                { text: `No❌`, callback_data: `token_base_burn_no` }
            ],
        ];

        return { title, button };
    },
    myTradesPage: (trade, currentPageNumber) => {
        const title = `

        🪙Coin: <code>${trade.whaleWallet}</code>
        💳Wallet: 
        <code>${trade.myWallet}</code>
        👑Copy Trader:
        <code>${trade.whaleWallet}</code>
        
        👆Tap to copy the copy trader 💸

Current page ${currentPageNumber + 1} pages`;
        const button = [

            [
                { text: `Prev⬅️`, callback_data: `my_base_trade_result_prev-${currentPageNumber - 1}` },
                { text: `${currentPageNumber + 1}`, callback_data: `page_number` },
                { text: `Next➡️`, callback_data: `my_base_trade_result_next-${currentPageNumber + 1}` }
            ],

            [
                { text: `Back 🔙`, callback_data: `base_position_back` }
            ]
        ];

        return { title, button };
    },
    myTradesEmptyPage: () => {
        const title = ` 🚫You have no Trading History.`;

        const button = [

            [
                { text: `Prev⬅️`, callback_data: `my_trade_result_prev-empty` },
                { text: `0`, callback_data: `page_number` },
                { text: `Next➡️`, callback_data: `my_trade_result_next-empty` }
            ],

            [
                { text: `Back 🔙`, callback_data: `base_position_back` }
            ]
        ];
        return { title, button };
    },
}

module.exports = BasePositionUI;