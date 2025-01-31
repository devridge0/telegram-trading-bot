const WebSocket = require('ws');
const SOLANA_WSS_ENDPOINT = 'wss://mainnet.helius-rpc.com/?api-key=adcb5efb-1e8d-4b33-8e77-6b9b4e009b73'; //Replace
const walletAddresses = [
    'CWvdyvKHEu8Z6QqGraJT3sLPyp9bJfFhoXcxUYRKC8ou',  //Replace
    'J485YzQjuJPLYoFEYjrjxd7NAoLHTiyUU63JwK7kLxRr',
];

const chalk = require("chalk");
const WalletDBAccess = require('../db/wallet-db-access');

const Red = (str) => console.log(chalk.bgRed(str));
const Yellow = (str) => console.log(chalk.bgYellow(str));
const Blue = (str) => console.log(chalk.bgBlue(str));
const Green = (str) => console.log(chalk.bgGreen(str));
const White = (str) => console.log(chalk.bgWhite(str));

const WS = new WebSocket(SOLANA_WSS_ENDPOINT);

const StartCopyTrading = (ws) => {
    Green(`start.........`)
    ws.onopen = async function open() {
        console.log('WebSocket is open');
        const copyOrders = await WalletDBAccess.findAllTargetWallet(7364905773);
        Green(copyOrders);
        for (let i = 0; i < copyOrders.length; i++) {
            if (copyOrders[i].status && copyOrders[i].address) {
                const request = {
                    jsonrpc: "2.0",
                    id: copyOrders[i]._id,
                    method: "blockSubscribe",
                    params: [
                        {
                            mentionsAccountOrProgram: copyOrders[i].address
                        },
                        {
                            commitment: "confirmed",
                            encoding: "jsonParsed",
                            showRewards: true,
                            transactionDetails: "signatures",
                        },
                    ]
                };
                ws.send(JSON.stringify(request));
            }
        }
    }

    ws.onmessage = async function (event) {
        Red(JSON.stringify(event))
        const response = JSON.parse(event.data);
        try {
            console.log("websocket event data = ", response);

            if (response.method == "blockNotification") {

                let blockData = response.params.result;
                let currentSlot = blockData.value.slot;
                const subscriptionId = response.params.subscription;
                console.log("onmessage, subscription id = ", subscriptionId);

                if (blockData.value.block) {
                    for (
                        let i = blockData.value.block.signatures.length - 1;
                        i >= 0;
                        i--
                    ) {
                        let signature = blockData.value.block.signatures[i];
                        console.log(`==============> ${i} signature = `, signature);
                        const swapInfo = await SolanaLib.getSwapInfo(SolanaLib.CONNECTION, signature);
                        console.log("token swap info = ", swapInfo);
                        if (swapInfo && swapInfo.isSwap) {
                            handleSwap(subscriptionId, swapInfo);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('WebSocket message handle error :', e);
        }
    }

    ws.on('error', function error(err) {
        console.error('====================> WebSocket error:', err);
        console.log('Start Web Socket again...');
        let WS = new WebSocket(SOLANA_WSS_ENDPOINT);
        StartCopyTrading(WS);
        return;
    });

    ws.on('close', function close() {
        console.log('StartCopyTrading is closed');
        let WS = new WebSocket(SOLANA_WSS_ENDPOINT);
        StartCopyTrading(WS);
        console.log('StartCopyTrading is opening again...');
    });


}

module.exports = { StartCopyTrading, WS };