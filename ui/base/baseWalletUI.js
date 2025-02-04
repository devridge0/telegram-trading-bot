const BaseWalletUI = {
    walletPage: (publicKey, privateKey, url) => {
        const title = `📝 EDIT WALLET: Select an option

Address: <code>${publicKey}</code>
(Tap to copy)

Private key:
<code>${privateKey}</code>

(Tap to reveal)`;
        const button = [
            [
                { text: `Wallet Delete 🗑`, callback_data: `base_wallet_delete` }
            ],
            [
                { text: `Etherscan 🌐`, callback_data: `base_ethscan`, url: url.ethscan }
            ],
            [
                { text: `Deposit 💵`, callback_data: `base_deposit`, url: url.deposit },
                { text: `Withdraw`, callback_data: `base_withdraw` }
            ],
            [
                { text: `Back 🔙`, callback_data: `base_back` }
            ]
        ];

        return { title, button };
    },

    deleteWalletPage: (publicKey) => {
        const title = `🚫 Are you sure you want to delete this wallet?

    Wallet Address: 
    <code>${publicKey}</code>

     IF YOU DID NOT STORE YOUR PRIVATE KEY OR MNEMONIC PHRASE, YOU WILL LOSE ACCESS TO THIS WALLET FOREVER`;

        const button = [
            [
                { text: `✅Yes`, callback_data: `base_wallet_delete_yes` }
            ],
            [
                { text: `❌No`, callback_data: `base_wallet_delete_no` }
            ]
        ];

        return { title, button };
    },
    createAndImportWalletPage: () => {
        const title = `🗑 Wallet deleted successfully`;

        const button = [
            [
                { text: `Create new wallet🆕`, callback_data: `base_create_new_wallet` }
            ],
            [
                { text: `Import existing wallet📥`, callback_data: `base_import_wallet` }
            ],
            [
                { text: `Back 🔙`, callback_data: `base_wallet_back` }
            ]
        ];

        return { title, button };
    },
    createNewWalletPage: (publicKey, privateKey) => {
        const title = `Wallet created successfully 🎉

Address: <code>${publicKey}</code>

Private Key: 
<code>${privateKey}</code>
Mnemonic phrase: N/A

BE SURE TO COPY DOWN THIS INFORMATION NOW AS IT WILL NEVER BE SHOWN AGAIN`;

        const button = [
            [
                { text: `Back 🔙`, callback_data: `base_create_new_wallet_back` }
            ]
        ];

        return { title, button };
    },
    importNewWalletPage: () => {
        const title = `🎉 Wallet imported successfully`

        const button = [
            [
                { text: `Back 🔙`, callback_data: `base_create_new_wallet_back` }
            ]
        ];

        return { title, button };
    },

    withdrawAmountPage: () => {
        const title = `Choose amount to withdraw`;
        const button = [
            [
                { text: `Withdraw All`, callback_data: `base_withdraw_all` },
                { text: `Customer Amount`, callback_data: `base_customer_amount` }
            ]
        ];

        return { title, button };
    },

    withdrawAllConfirmYesPage: () => {
        const title = `Confirm Withdraw.`;
        const button = [
            [
                { text: `Yes✅`, callback_data: `base_withdraw_all_yes` },
                { text: `No❌`, callback_data: `base_withdraw_all_no` }
            ]
        ];

        return { title, button };
    },

    withdrawCustomerAmountConfirmPage: (publicKey) => {
        const title = `Enter amount to withdraw`;
        const button = [
            [
                { text: `Yes✅`, callback_data: `withdraw_all_yes` },
                { text: `No❌`, callback_data: `withdraw_all_no` }
            ]
        ];
        return { title, button };
    },
}

module.exports = BaseWalletUI;