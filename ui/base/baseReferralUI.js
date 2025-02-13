const BaseReferralUI = {
    referralPage: (chatId,publicKey) => {
        const title = `Referrals | Refer Users & Earn Commissions

Referred Users : 0

Share your referral link(s) and earn 10% SOL of swap fees from users who click your link. Withdraw earnings using your Fee Receiver Wallet.

Note that, for solana you need to have at least 0.001 SOL in your wallet to receive fees.

Fee Receiver Wallet: 
<code>${publicKey}</code>

Link:
<code>https://t.me/revenger0412_bot?start=${chatId}</code> 🎁`

        const button = [
            [
                { text: `Set Wallet For Commissions🎁`, callback_data: `base_set_wallet_commission` }
            ],
            // [
            //     { text: `Share your referral link`, callback_data: `base_share_your_referral_link` }
            // ],
            [
                { text: `Back 🔙`, callback_data: `base_back` }
            ]
        ];

        return { title, button };
    },

}

module.exports = BaseReferralUI;