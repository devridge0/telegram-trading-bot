const BaseDepositUI = {
    depositPage: (publicKey, url) => {
        const title = `1️⃣ Deposit Button:
 • Simplify your transactions by using MoonPay.
 • For your first purchase, simply accept their terms and complete identity verification.
👉 Click the "Deposit 💵" button to get started.

2️⃣ Direct Transfer:
 • Prefer to send your funds directly? Here is your wallet address:

💼 Wallet Address: <code>${publicKey}</code>
💰 Crypto: <code>ETH</code>
🔗 Network: <code>ETH (ERC20)</code>`;
        const button = [
            [
                { text: `Ethscan 🌐`, callback_data: `base_deposit`, url: url.ethscan }
            ],
            [
                { text: `Deposit 💵`, callback_data: `base_deposit`, url: url.deposit }
            ],
            [
                { text: `Back 🔙`, callback_data: `base_wallet_back` }
            ]
        ];
        return { title, button };
    },
}

module.exports = BaseDepositUI;