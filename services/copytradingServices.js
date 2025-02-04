const WebSocket = require('ws');
const CopyTradingController = require('../controller/copyTradingController');
const SOLANA_WSS_ENDPOINT = 'wss://mainnet.helius-rpc.com/?api-key=adcb5efb-1e8d-4b33-8e77-6b9b4e009b73'; //Replace
const TelegramBot = require('node-telegram-bot-api');
const chalk = require("chalk");
const WalletDBAccess = require('../db/wallet-db-access');
const { getSwapInfo, getSolBalanceSOL, getSellTokenAmount, JUPITER_TOKN_SWAP } = require('./solana');


const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));


const WS = new WebSocket(SOLANA_WSS_ENDPOINT);
let activeAddresses = [];

const StartCopyTrading = (ws) => {
    console.log(`Copy Trading WebSocket starting...`);
    try {
        ws.on('message', async (data) => {
            const response = JSON.parse(data);
            Green(`New address starting ... ${JSON.stringify(response)}`);
            if (typeof response.result == 'number') {
                activeAddresses[activeAddresses.length - 1].id = response.result;
            }
            if (response.method === "logsNotification") {
                const signature = response.params.result.value.signature;
                const subscriptionId = response.params.subscription;
                const subAddress = activeAddresses.filter((e) => e.id == subscriptionId);
                console.log(`🔍Transaction find!!! ${subAddress[0].address}===> ${signature}`);
                const swapInfoResult = await getSwapInfo(signature);
                const result = { ...swapInfoResult, whaleAddress: subAddress[0].address };
                White(`📜 ${JSON.stringify(result)}`)
                try {
                    if (result.isSwap) {
                        console.log(`✅ Find opportunity!!!📌`);
                        const findUserWallet = await WalletDBAccess.findWallet(subAddress[0].chatId);
                        const currentSolBalance = await getSolBalanceSOL(findUserWallet.publicKey);
                        if (currentSolBalance * (10 ** 9) < findUrsserWallet.jitoTip) {
                            return;
                        }

                        let mode;
                        let copyTradingResult;
                        if (result.receiveToken == `So11111111111111111111111111111111111111112`) {
                            mode = "sell";
                            const sellAmount = await getSellTokenAmount(findUserWallet.publicKey, result.sendToken);
                            Blue(`sell Amount  --------> ${sellAmount}`)
                            copyTradingResult = await JUPITER_TOKN_SWAP(result.sendToken, findUserWallet.privateKey, sellAmount, findUserWallet.slippage, findUserWallet.jitoTip, mode);
                        } else {
                            mode = 'buy';
                            copyTradingResult = await JUPITER_TOKN_SWAP(result.receiveToken, findUserWallet.privateKey, findUserWallet.buyAmount, findUserWallet.slippage, findUserWallet.jitoTip, mode);
                        }
                        if (copyTradingResult) {
                            const saveCopyTradingResult = await WalletDBAccess.saveCopyTradingHistory(chatId, result.sendToken, result.receiveToken, findUserWallet.publicKey, address, mode)
                        }
                    }

                } catch (error) {
                    Red(`actionMainCopyTrading ====>   ${error}`);
                }
            }

            ws.on('close', async () => {
                console.log('Disconnected from server');
                Green(JSON.stringify(activeAddresses))
                setTimeout(async () => {
                    StartCopyTrading(new WebSocket(SOLANA_WSS_ENDPOINT));
                    const trackingPromises = activeAddresses.map((e) =>
                        startTracking(e.address, e.chatId)
                    );
                    await Promise.all(trackingPromises);
                }, 5000);
            });
            ws.on('error', async () => {
                console.log('Disconnected from server error');
                Green(JSON.stringify(activeAddresses))
                setTimeout(async () => {
                    StartCopyTrading(new WebSocket(SOLANA_WSS_ENDPOINT));
                    const trackingPromises = activeAddresses.map((e) =>
                        startTracking(e.address, e.chatId)
                    );
                    await Promise.all(trackingPromises);
                }, 5000);
            });
        });
    } catch (error) {
        Red(`StartCopy Trading : ${error}`)
    }
}

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

// StartCopyTrading(WS);


module.exports = { StartCopyTrading, WS, startTracking, stopTracking };