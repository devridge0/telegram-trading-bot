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

const StartCopyTrading = (ws, chatId) => {
    ws.on("open", async () => {
        Green(`Copy Trading start Socket ......`);
        try {
            const copyOrders = await WalletDBAccess.findAllTargetWallet(chatId);
            for (let i = 0; i < copyOrders.length; i++) {
                if (copyOrders[i].status === 'true' && copyOrders[i].address) {
                    const request = {
                        jsonrpc: "2.0",
                        id: copyOrders[i]._id,
                        method: "logsSubscribe",
                        params: [
                            { mentions: [copyOrders[i].address] },
                            { commitment: "confirmed" }
                        ]
                    };
                    ws.send(JSON.stringify(request));
                }
            }
        } catch (error) {
            Red(`Error in WebSocket open event: ${error.message}`);
        }
    });

    ws.on("message", async (data) => {
        const parsedData = JSON.parse(data);
        Green(JSON.stringify(parsedData));

        // if (parsedData.method === 'logsNotification') {
        //     const signature = parsedData.params.result.value.signature;
        //     console.log(`✅ Transaction Detected for Wallet: ${signature}`);
        //     const getSwapInfoResult = await getSwapInfo(signature);

        // }

    });

    // ws.on('error', function error(err) {
    //     console.log('❌WebSocket error:', err);
    //     let WS = new WebSocket(SOLANA_WSS_ENDPOINT);
    //     StartCopyTrading(WS, chatId);
    //     console.log('Start Web Socket again...');
    //     return;
    // });

    // ws.on('close', function close() {
    //     console.log('StartCopyTrading is closed');
    //     let WS = new WebSocket(SOLANA_WSS_ENDPOINT);
    //     StartCopyTrading(WS, chatId);
    //     console.log('StartCopyTrading is opening again...');
    // });


}

module.exports = { StartCopyTrading, WS };