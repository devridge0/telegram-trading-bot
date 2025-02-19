const WebSocket = require('ws');
const CopyTradingController = require('../controller/copyTradingController');
const SOLANA_WSS_ENDPOINT = 'wss://mainnet.helius-rpc.com/?api-key=adcb5efb-1e8d-4b33-8e77-6b9b4e009b73'; //Replace
const TelegramBot = require('node-telegram-bot-api');
const chalk = require("chalk");
const WalletDBAccess = require('../db/wallet-db-access');
const { getSwapInfo, getSolBalanceSOL, getSellTokenAmount, JUPITER_TOKN_SWAP, getKeypairfromPirvaetKeySOL, withdrawAllSOL } = require('./solana');


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));


let WS = new WebSocket(SOLANA_WSS_ENDPOINT);;
let activeAddresses = [];

(async () => {
    const deleteTarget = await WalletDBAccess.deleteTargetWallet(6488292237, `A1m7rq5UgnSKEtwrhkt1FjJMgei94C5sugeD8W7a5yza`);
    console.log(`delete ====🚀`, deleteTarget);
})()


function startTracking(address, chatId) {
    subscribeAddress(address, chatId);
}

// Stop button (unsubscribe from an address)
function stopTracking(address, chatId) {
    unsubscribeAddress(address, chatId);
}

function subscribeAddress(address, chatId) {
    try {
        activeAddresses = activeAddresses.filter((e) => e.address != address);
        activeAddresses.push({ address, chatId, id: 1, })

        WS.send(JSON.stringify({
            jsonrpc: "2.0",
            id: `sub-${address}`,
            method: "logsSubscribe",
            params: [{ mentions: [address] }, { commitment: "confirmed" }]
        }));
    } catch (e) {
        Red(`subscription  ${e} `)
    }
}

// Function to unsubscribe an address
function unsubscribeAddress(address) {
    try {

        const result = activeAddresses.filter((e) => e.address == address);

        WS.send(JSON.stringify({
            jsonrpc: "2.0",
            id: `unsub-${address}`,
            method: "logsUnsubscribe",
            params: [result[0].id] // Using the subscription ID
        }));
    } catch (error) {
        Red(`unsubsciption ===== ${error}`)
    }
}



const StartCopyTrading = async () => {
    try {

        const previousSubscribers = await WalletDBAccess.findAllSubscribersTargetWallet();
        activeAddresses = [];

        await previousSubscribers.map((e) => {
            if (e.status == 'true') {
                activeAddresses.push({ address: e.address, chatId: e.chatId, id: 1 })
            }
        })

        WS = new WebSocket(SOLANA_WSS_ENDPOINT);
        console.log(`Copy Trading WebSocket starting...`);


        WS.on('open', async () => {
            Green(`New subscribeAddress starting ... ${JSON.stringify(activeAddresses)}`);
            await activeAddresses.map((e) =>
                WS.send(JSON.stringify({
                    jsonrpc: "2.0",
                    id: `sub-${e.address}`,
                    method: "logsSubscribe",
                    params: [{ mentions: [e.address] }, { commitment: "confirmed" }]
                }))
            );
        });


        WS.on('message', async (data) => {
            const response = JSON.parse(data);
            Green(`New address starting ... ${JSON.stringify(response)}`);
            if (typeof response.result == 'number') {
                activeAddresses = activeAddresses.map((e) => {
                    if (e.address == response.id.slice(4, response.id.length)) {
                        e.id = response.result
                    }
                    return e;
                })
            }

            if (response.method === "logsNotification") {
                try {
                    const signature = response.params.result.value.signature;
                    const subscriptionId = response.params.subscription;
                    const subAddress = activeAddresses.filter((e) => e.id == subscriptionId);

                    console.log(`🔍Transaction find!!! ${subAddress[0].address}===> ${signature}`);
                    const swapInfoResult = await getSwapInfo(signature);
                    const result = { ...swapInfoResult, whaleAddress: subAddress[0].address };
                    const findUserWallet = await WalletDBAccess.findWallet(subAddress[0].chatId);
                    Blue(`📜 ${JSON.stringify(result)}`)
                    if (result.isSwap && (result.sendToken == `So11111111111111111111111111111111111111112` || result.receiveToken == `So11111111111111111111111111111111111111112`)) {
                        console.log(`✅ Find opportunity!!!📌`);
                        const currentSolBalance = await getSolBalanceSOL(findUserWallet.publicKey);
                        if (currentSolBalance * (10 ** 9) < findUserWallet.jitoTip) {
                            return;
                        }

                        let copyTradingResult;
                        if (result.sendToken == `So11111111111111111111111111111111111111112`) {
                            copyTradingResult = await JUPITER_TOKN_SWAP(result.sendToken, findUserWallet.privateKey, findUserWallet.buyAmount, findUserWallet.slippage, findUserWallet.jitoTip, 'buy');
                        } else if (result.receiveToken == `So11111111111111111111111111111111111111112`) {
                            const sellAmount = await getSellTokenAmount(findUserWallet.publicKey, result.sendToken);
                            copyTradingResult = await JUPITER_TOKN_SWAP(result.sendToken, findUserWallet.privateKey, sellAmount, findUserWallet.slippage, findUserWallet.jitoTip, 'sell');
                        } else {
                            return;
                        }

                        if (copyTradingResult) {

                            //referall reward
                            const saveCopyTradingResult = await WalletDBAccess.saveCopyTradingHistory(chatId, result.sendToken, result.receiveToken, findUserWallet.publicKey, address, mode)
                            const referralResult = await WalletDBAccess.referallUserConfirm(chatId);
                            if (referralResult) {
                                const signer = await getKeypairfromPirvaetKeySOL(findUserWallet.privateKey);
                                const withdrawCosutomResult = await withdrawAllSOL(findUserWallet.publicKey, findUserWallet.referralWallet, signer, findUserWallet.buyAmount * 0.05);
                            }

                        }

                    }
                } catch (error) {
                    Red(`copy trading Servercie error ====>   ${error}`);
                }
            }
        });

        WS.on('close', async () => {
            console.log('Disconnected from server');
            WS.close();
            setTimeout(async () => {
                StartCopyTrading(WS);
            }, 5000);
        });

        WS.on('error', async () => {
            console.log('Disconnected from server error');
            WS.close();
            setTimeout(async () => {
                StartCopyTrading(WS);
            }, 5000);
        });
    } catch (error) {
        Red(`StartCopy Trading : ${error}`)
    }
}




// StartCopyTrading(WS);


module.exports = { StartCopyTrading, WS, startTracking, stopTracking };