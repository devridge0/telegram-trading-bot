const DepositUI = {
    depositPage: (publicKey, url) => {
        const title = `We currently facilitate transactions with MoonPay for cryptocurrency sales. To sell cryptocurrencies through a third-party platform
You must agree to their terms of service and complete their initial Know Your Customer (KYC) process for the first transaction.

Please click on the button below to Deposit using Credit/Debit Card

Wallet Address 👇
<code>${publicKey}</code>
Currency : SOL
Chain&Protocol : SOL (SPL)`;
        const button = [
            [
                { text: `Solscan 🌐`, callback_data: `deposit`, url: url.solscan }
            ],
            [
                { text: `Deposit 💵`, callback_data: `deposit`, url: url.deposit }
            ],
            [
                { text: `Back 🔙`, callback_data: `back` }
            ]
        ];
        return { title, button };
    },
}

module.exports = DepositUI;