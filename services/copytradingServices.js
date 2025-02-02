const WebSocket = require('ws');
const SOLANA_WSS_ENDPOINT = 'wss://mainnet.helius-rpc.com/?api-key=adcb5efb-1e8d-4b33-8e77-6b9b4e009b73'; //Replace
const walletAddresses = [
    'CWvdyvKHEu8Z6QqGraJT3sLPyp9bJfFhoXcxUYRKC8ou',  //Replace
    'J485YzQjuJPLYoFEYjrjxd7NAoLHTiyUU63JwK7kLxRr',
];

const chalk = require("chalk");
const WalletDBAccess = require('../db/wallet-db-access');
const { getSwapInfo, getSolBalanceSOL } = require('./solana');
const { copyTradingStartAndStopPageSOL } = require('../controller/copyTradingController');

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
                const swapInfo = { ...swapInfoResult, whaleAddress: subAddress[0].address };

            }
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