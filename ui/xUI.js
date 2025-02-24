const XUI = {

    xFollowPage: (xAccount) => {
        console.log(`XXXXAccount ------------ ${xAccount}`)
        const title = `🔄 COPY: Select a wallet to follow

Discover our top wallets -><a href="https://t.me/tokens_launchs">TOKEN NEWS</a>`;
        const button = [
            [
                { text: `🗞Token News`, callback_data: `x_token_news`, url: `https://t.me/tokens_launchs` }
            ],
            [
                { text: `➕Add new X account`, callback_data: `add_new_x_account` }
            ],
        ];
        const showAllWhale = (XAccounts) => {
            const result = XAccounts.map((xAccount) => [
                { text: `${xAccount.xaccount}📝`, callback_data: `xAccount_page_${xAccount.address}` },
                { text: `${xAccount.status === `false` ? "OFF🚫" : "Yes✅"}`, callback_data: `copytrade_${xAccount.xaccount}_${xAccount.status}` },
            ]
            )
            button.push(...result);
        }
        if (xAccount.length > 0) {
            showAllWhale(xAccount);
        }
        button.push([
            { text: `Back 🔙`, callback_data: `back` }
        ]);

        return { title, button };
    },
}

module.exports = XUI;