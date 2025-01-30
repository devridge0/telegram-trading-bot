const CopyTradingUI = {
    copyTradingPage: (whale) => {
        const title = `🔄 COPY: Select a wallet to follow

Discover our top wallets -><a href="https://t.me/eclipsewhales">CLICK HERE</a>`;
        const button = [
            [
                { text: `➕Add new copy address`, callback_data: `add_new_whale_address` }
            ],
        ];
        const showAllWhale = (Whales) => {
            const result = Whales.map((whale) => [{ text: `${whale.status === `false` ? "OFF🚫" : "Yes✅"}`, callback_data: `copytrade_${whale.address}_${whale.status}` },
            { text: `${whale.name}📝`, callback_data: `whale_page_${whale.address}` }]
            )
            button.push(...result);
        }
        if (whale.length > 0) {
            showAllWhale(whale);
        }
        button.push([
            { text: `Back 🔙`, callback_data: `back` }
        ]);

        return { title, button };
    },
    whalePage: (whale) => {
        const title = `EDIT MIRROR: Select an option 📝

Label: ${whale.name}
Address: <code>${whale.address}</code>`;
        const button = [
            [
                { text: `Delete 🗑`, callback_data: `delete_whale_wallet_${whale.address}` }
            ],
            [
                { text: `View on Solscan 🌐`, callback_data: `add_new_whale_address`, url: `https://solscan.io/account/${whale.address}` }
            ],
            [
                { text: `Analytic📊`, callback_data: `add_new_whale_address`, url: `https://coinstats.app/address/${whale.address}` }
            ],
            [
                { text: `Back 🔙`, callback_data: `copy_trading_page_back` }
            ]
        ];

        return { title, button };
    },
}

module.exports = CopyTradingUI;