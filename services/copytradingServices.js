const WebSocket = require('ws');
const SOLANA_WSS_ENDPOINT = 'wss://mainnet.helius-rpc.com/?api-key=adcb5efb-1e8d-4b33-8e77-6b9b4e009b73'; //Replace
const walletAddresses = [
    'CWvdyvKHEu8Z6QqGraJT3sLPyp9bJfFhoXcxUYRKC8ou',  //Replace
    'J485YzQjuJPLYoFEYjrjxd7NAoLHTiyUU63JwK7kLxRr',
];

const chalk = require("chalk");
const WalletDBAccess = require('../db/wallet-db-access');
const { getSwapInfo } = require('./solana');

const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

const WS = new WebSocket(SOLANA_WSS_ENDPOINT);

let activeAddresses = []

const StartCopyTrading = (ws) => {
    console.log(`Copy Trading WebSocket starting...`);

    ws.on('message', (data) => {
        const response = JSON.parse(data);
        activeAddresses[activeAddresses.length - 1].id = response.result
        Blue(JSON.stringify(activeAddresses[activeAddresses.length - 1]))
        Green(JSON.stringify(response))
        if (response.method === "logsNotification") {
            const signature = response.params.result.value.signature;
            console.log(`✅Transaction find!!! ===> ${signature}`);
        }
    });

}

function startTracking(address) {
    subscribeAddress(address);
}

// Stop button (unsubscribe from an address)
function stopTracking(address) {
    unsubscribeAddress(address);
}

function subscribeAddress(address) {
    console.log(`Subscribed to: ${address}`);
    activeAddresses.push({ address, id: 1 })

    WS.send(JSON.stringify({
        jsonrpc: "2.0",
        id: `sub-${address}`,
        method: "logsSubscribe",
        params: [{ mentions: [address] }, { commitment: "confirmed" }]
    }));
}

// Function to unsubscribe an address
function unsubscribeAddress(address) {
    const result = activeAddresses.filter((e) => e.address == address);
    White(result[0].id)
    console.log(`Unsubscribed from: ${address}`);

    WS.send(JSON.stringify({
        jsonrpc: "2.0",
        id: `unsub-${address}`,
        method: "logsUnsubscribe",
        params: [result[0].id] // Using the subscription ID
    }));
}

// StartCopyTrading(WS);


module.exports = { StartCopyTrading, WS, startTracking, stopTracking };