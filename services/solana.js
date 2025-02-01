const bs58 = require('bs58');
const fetch = require('cross-fetch')
const chalk = require('chalk');
const { TOKEN_PROGRAM_ID, Token, AccountLayout } = require('@solana/spl-token');
const dotenv = require('dotenv');
dotenv.config();

let newSignList = [];

const {
    Keypair,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    VersionedTransaction,
    Transaction,
    TransactionMessage,
    sendAndConfirmTransaction,
    SystemProgram,
} = require("@solana/web3.js");
const { Metaplex } = require('@metaplex-foundation/js');
const axios = require('axios');
const { Wallet } = require('@project-serum/anchor');

const jito_Validators = [
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
];

const Red = (str) => console.log(chalk.bgRed(`${str}\n`));
const Yellow = (str) => console.log(chalk.bgYellow(`${str}\n`));
const Blue = (str) => console.log(chalk.bgBlue(`${str}\n`));
const Green = (str) => console.log(chalk.bgGreen(`${str}\n`));
const White = (str) => console.log(chalk.bgWhite(`${str}\n`));

const SOL_RPC = `https://withered-chaotic-rain.solana-mainnet.quiknode.pro/2adcb441bbd017922a33adaa5ebbddb9b4287c82`
const FREE_SOL_RPC = 'https://mainnet.helius-rpc.com/?api-key=adcb5efb-1e8d-4b33-8e77-6b9b4e009b73'
const FREE_HELIUS_SOL_RPC = `https://mainnet.helius-rpc.com/?api-key=f218537d-efde-4fc6-b757-bf1804c077c1`
let connection;
(() => {
    try {
        // connection = new Connection('https://withered-chaotic-rain.solana-mainnet.quiknode.pro/2adcb441bbd017922a33adaa5ebbddb9b4287c82', 'confirmed');
        connection = new Connection(FREE_HELIUS_SOL_RPC, 'confirmed');
    } catch (error) {
        Red(`Sever error ... ${error}`)
    }
})()


const SolanaNetwork = {
    isValidPublicKeySOL: async (publicKey) => {
        try {
            const key = new PublicKey(publicKey);
            return true;
        } catch (error) {
            return false;
        }
    },

    isValidPrivateKeySOL: async (privateKey) => {
        try {
            const decodedKey = bs58.decode(privateKey);
            if (decodedKey.length !== 64) {
                return false;
            }
            else return true;
        } catch (error) {
            return false; // Invalid if an error occurs
        }
    },

    getPublicKeyFromPrivateKeySOL: (privateKey) => {
        try {
            const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
            return keypair.publicKey.toString();
        } catch (error) {
            Red(`getPublicKeyFromPrivateKeySOL ====🚀`, error);
            return null;
        }
    },

    createWalletSOL: async () => {
        try {
            let keypair = Keypair.generate();
            const publicKey = keypair.publicKey.toString();
            const privateKeyArray = keypair.secretKey;
            const privateKey = bs58.encode(Buffer.from(privateKeyArray));
            return { publicKey, privateKey };
        } catch (error) {
            Red(`createWallet ====🚀`, error);
        }
    },

    getKeypairfromPirvaetKeySOL: (privateKey) => {
        return Keypair.fromSecretKey(bs58.decode(privateKey));
    },

    getSolBalanceSOL: async (publicKey) => {
        try {
            const publicKeyStr = new PublicKey(publicKey);
            const balance = await connection.getBalance(publicKeyStr);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            Red(`getSolBalance ====🚀${error}`);
        }
    },

    withdrawAllSOL: async (fromPubkey, toPubkey, signer, amount) => {
        try {
            Green(`${fromPubkey}, ${toPubkey}, ${signer}, ${amount}`)
            const transactionFee = 5000; // Adjust this value as needed
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(fromPubkey),
                    toPubkey: new PublicKey(toPubkey),
                    lamports: amount * LAMPORTS_PER_SOL - transactionFee,
                })
            );

            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [signer]
            );

            Yellow(`Withdrawal successful! Transaction Signature: ${signature}`);

            if (!signature) return false;
            else return true

        } catch (error) {
            Red(`withdrawAllSOL ====🚀${error}`);
        }
    },

    getSellTokenAmount: async (publicKey, address) => {
        try {
            const walletPublicKey = new PublicKey(publicKey);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
                programId: TOKEN_PROGRAM_ID
            });
            const sellTokenAmountResult = tokenAccounts.value.filter(account => {
                if (account.account.data.parsed.info.mint == address) {
                    return account.account.data.parsed.info.tokenAmount.uiAmount;
                }
            });

            return sellTokenAmountResult;

        } catch (error) {
            Red(`getSellTokenAmount ====🚀${error}`);
        }
    },

    getMyTokensInWalletSOL: async (publicKey) => {
        try {
            const walletPublicKey = new PublicKey(publicKey);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
                programId: TOKEN_PROGRAM_ID
            });
            const tokenList = tokenAccounts.value.map(account => {
                return {
                    mint: account.account.data.parsed.info.mint,
                    amount: account.account.data.parsed.info.tokenAmount.uiAmount,
                    decimals: account.account.data.parsed.info.tokenAmount.decimals
                }
            });

            const nonZeroTokens = tokenList.filter((token) => token.amount > 0);

            const nameAndToken = await Promise.all(nonZeroTokens.map(async (token) => {
                const mintAddress = new PublicKey(token.mint);
                const metaplex = Metaplex.make(connection);
                const mataData = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
                return { ...token, name: mataData.name }
            }));

            async function fetchTokenPrice(nameAndToken) {
                try {
                    const onlyname = nameAndToken.map((token) => token && token.mint);
                    const url = `https://api.jup.ag/price/v2?ids=eL5fUxj2J4CiQsmW85k5FG9DvuQjjUoBHoQBi2Kpump,${onlyname.join(',')}`
                    const tokenPriceList = await axios.get(url);
                    let newList = nameAndToken.map((token) => {
                        if (tokenPriceList.data.data[token.mint]) {
                            return { ...token, price: tokenPriceList.data.data[token.mint]?.price || 0 };
                        } else {
                            return { ...token, price: 0 };
                        }
                    });

                    return newList;

                } catch (error) {
                    Red(`fetchTokenPrice ====🚀${error}`);
                    return 0;
                }
            }

            const totalData = await fetchTokenPrice(nameAndToken);

            return totalData;
        } catch (error) {
            Red(`getMyTokensInWalletSOL ====🚀${error}`);
        }
    },

    validateTokenAddress: async (tokenAddress) => {
        try {
            const tokenPublicKey = new PublicKey(tokenAddress);
            const accountInfo = await connection.getAccountInfo(tokenPublicKey);

            if (!accountInfo) {
                console.log('Token address is invalid or does not exist.');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating token address:', error);
            return false;
        }
    },

    JUPITER_TOKN_SWAP: async (tokenMintAddress, payerSecretKey, amount, slippage, jitoTip, mode) => {
        try {

            const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(payerSecretKey)));
            const keypair = Keypair.fromSecretKey(bs58.decode(payerSecretKey));

            let quoteResponse;
            if (mode == 'buy') {
                White(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${tokenMintAddress}&amount=${amount * LAMPORTS_PER_SOL}&slippageBps=${slippage}`)
                quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${tokenMintAddress}&amount=${amount * LAMPORTS_PER_SOL}&slippageBps=${slippage}`);
            }
            else {
                Blue(`Sell mode............`)
                White(`https://quote-api.jup.ag/v6/quote?inputMint=${tokenMintAddress}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=${slippage}`)
                quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${tokenMintAddress}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=${slippage}`);
            }

            const quote = await quoteResponse.json();
            console.log("--> Quote:", quote);

            const swapTransactionResponse = await fetch(
                "https://quote-api.jup.ag/v6/swap",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        quoteResponse: quote,
                        userPublicKey: wallet.publicKey.toString(),
                        wrapAndUnwrapSol: true,
                        prioritizationFeeLamports: {
                            autoMultiplier: 2, // when there's a lot of congestions for the pair, double the suggested fee
                        },
                    }),
                }
            );
            const { swapTransaction } = await swapTransactionResponse.json();

            const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
            let transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            transaction.sign([wallet.payer]);


            const txid = bs58.encode(transaction.signatures[0]);
            const latestBlockHash = await connection.getLatestBlockhash();

            let result = await SolanaNetwork.JITO_BUNDLE(transaction, keypair, latestBlockHash, jitoTip);

            if (result) {
                console.log(`--> Tx confirmed! Details: https://solscan.io/tx/${txid}`);
                return true;
            }
            else {
                return false;
            }

        } catch (error) {
            Red(`"Swap Error:", ${error}`);
            return false;
        }
    },

    burnMyTokenSOL: async (tokenMintAddress, privateKey, amount) => {
        try {
            const mintAddress = new PublicKey(tokenMintAddress);
            const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));

            const tokenAccount = await connection.getTokenAccountsByOwner(wallet.publicKey, {
                mint: mintAddress
            });

            Green(`tokenAccoujnt asdf  ${mintAddress}`)

            if (tokenAccount.value.length === 0) {
                throw new Error('No token account found for the specified mint address.');
            }

            const tokenAccountPubkey = new PublicKey(tokenAccount.value[0].pubkey);
            const tokenAmountInfo = await connection.getTokenAccountBalance(tokenAccountPubkey);
            const decimals = tokenAmountInfo.value.decimals;

            Green(`tokenAccoujnt asdf  ${JSON.stringify(tokenAmountInfo)}`)
            Green(`tokenAccoujnt asdf  ${decimals}`);

            const transaction = new Transaction().add(
                Token.createBurnInstruction(
                    TOKEN_PROGRAM_ID,
                    mintAddress,
                    wallet.publicKey,
                    wallet.publicKey,
                    [],
                    amount
                )
            );

            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [wallet]
            );

            Yellow(`Burn successful! Transaction Signature: ${signature}`);

            // const transaction = new Transaction().add(
            //     Token.createBurnCheckedInstruction(
            //         TOKEN_PROGRAM_ID,
            //         mintAddress,
            //         tokenAccountPubkey,
            //         wallet.publicKey,
            //         [],
            //         Math.floor(Number(amount) * Math.pow(10, decimals)), // Adjust the amount to burn as needed
            //     ));

            // Green(`tokenAccoujnt asdf  ${transaction}`)


            // const signature = await sendAndConfirmTransaction(
            //     connection,
            //     transaction,
            //     [wallet.payer]
            // );

            // Yellow(`Burn successful! Transaction Signature: ${signature}`);
            return true;
        } catch (error) {
            Red(`burnMyTokenSOL", ${error}`);
            return false;
        }
    },

    getSwapInfoforWallet: async (walletAddress) => {
        try {
            if (!await SolanaNetwork.isValidPublicKeySOL(walletAddress)) {
                throw new Error("Invalid public key input");
            }

            const targetWallet = new PublicKey(walletAddress);
            const signatures = await connection.getSignaturesForAddress(targetWallet, { limit: 1 });
            if (newSignList.includes(signatures[0].signature)) {
                Red(`Same signature.`);
                return { isSwap: false };
            } else {
                newSignList.push(signatures[0].signature);
                const swapInfoResult = await SolanaNetwork.getSwapInfo(signatures[0].signature);
                Blue(JSON.stringify(swapInfoResult));
                return { ...swapInfoResult, whaleWallet: walletAddress };
            }
        } catch (error) {
            Red(`getSwapInfoforWallet, ${error}`);
            return { isSwap: false };
        }
    },


    getTokenAddressFromTokenAccount: async (tokenAccountAddress) => {
        try {
            const tokenAccountPubkey = new PublicKey(tokenAccountAddress);
            const accountInfo = await connection.getAccountInfo(tokenAccountPubkey);

            if (accountInfo === null) {
                throw new Error('Token account not found');
            }

            const accountData = AccountLayout.decode(accountInfo.data);
            const mintAddress = new PublicKey(accountData.mint);

            return mintAddress.toBase58();
        } catch (error) {
            console.error('Error fetching token address:', error);
        }
    },

    getSwapInfo: async (signature) => {
        try {
            const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
            const instructions = tx?.transaction?.message?.instructions;
            const innerinstructions = tx?.meta?.innerInstructions;

            const raydiumPoolV4 = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
            const jupiterAggregatorV6 = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
            for (let i = 0; i < instructions.length; i++) {
                if (instructions[i].programId.toBase58() === raydiumPoolV4) {
                    Blue(`RAYDUIM^^^^^^^^^^^^^^^^^^^^^^^^^^^^`)
                    for (let j = 0; j < innerinstructions.length; j++) {
                        if (innerinstructions[j].index === i) {
                            const sendToken = await SolanaNetwork.getTokenAddressFromTokenAccount(innerinstructions[j].instructions[0].parsed.info.destination);
                            const sendAmount = innerinstructions[j].instructions[0].parsed.info.amount;
                            const receiveToken = await SolanaNetwork.getTokenAddressFromTokenAccount(innerinstructions[j].instructions[1].parsed.info.source);
                            const receiveAmount = innerinstructions[j].instructions[1].parsed.info.amount;
                            const result = { isSwap: true, type: "raydium swap", sendToken: sendToken, sendAmount: sendAmount, receiveToken: receiveToken, receiveAmount: receiveAmount };
                            return result;
                        }
                    }
                } else if (instructions[i].programId.toBase58() === jupiterAggregatorV6) {
                    Blue(`JUPITER^^^^^^^^^^^^^^^^^^^^^^^^^^^^`)
                    console.log('index = ', i);
                    for (let j = 0; j < innerinstructions.length; j++) {
                        if (innerinstructions[j].index === i) {
                            const length = innerinstructions[j].instructions.length;
                            let sendToken;
                            let sendAmount;
                            let receiveToken;
                            let receiveAmount;
                            for (let i = 0; i < length; i++) {
                                if (innerinstructions[j].instructions[i].programId.toBase58() == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                                    if (innerinstructions[j].instructions[i].parsed.type == "transferChecked") {
                                        sendToken = await SolanaNetwork.getTokenAddressFromTokenAccount(innerinstructions[j].instructions[i].parsed.info.destination);
                                        sendAmount = innerinstructions[j].instructions[i].parsed.info.tokenAmount.amount;
                                        break;
                                    }

                                    if (innerinstructions[j].instructions[i].parsed.type == "transfer") {
                                        sendToken = await SolanaNetwork.getTokenAddressFromTokenAccount(innerinstructions[j].instructions[i].parsed.info.destination);
                                        sendAmount = innerinstructions[j].instructions[i].parsed.info.amount;
                                        break;
                                    }
                                }
                            }

                            for (let i = length - 1; i >= 0; i--) {
                                if (innerinstructions[j].instructions[i].programId.toBase58() == 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                                    if (innerinstructions[j].instructions[i].parsed.type == "transferChecked") {
                                        receiveToken = await SolanaNetwork.getTokenAddressFromTokenAccount(innerinstructions[j].instructions[i].parsed.info.source);
                                        receiveAmount = innerinstructions[j].instructions[i].parsed.info.tokenAmount.amount;
                                        break;
                                    }

                                    if (innerinstructions[j].instructions[i].parsed.type == "transfer") {
                                        receiveToken = await SolanaNetwork.getTokenAddressFromTokenAccount(innerinstructions[j].instructions[i].parsed.info.source);
                                        receiveAmount = innerinstructions[j].instructions[i].parsed.info.amount;
                                        break;
                                    }
                                }
                            }

                            const result = { isSwap: true, type: "jupiter swap", sendToken: sendToken, sendAmount: sendAmount, receiveToken: receiveToken, receiveAmount: receiveAmount, blockTime: tx?.blockTime };
                            return result;
                        }
                    }
                }
            }

            return { isSwap: false, type: null, sendToken: null, sendAmount: null, receiveToken: null, receiveAmount: null, blockTime: null };;
        } catch (error) {
            console.log('getTokenSwapInfo, Error', error);
            return { isSwap: false, type: null, sendToken: null, sendAmount: null, receiveToken: null, receiveAmount: null, blockTime: null };;
        }
    },


    JITO_BUNDLE: async (transaction, payer, lastestBlockhash, jitofee) => {
        const jito_validator_wallet = await SolanaNetwork.getRandomValidator();
        try {
            const jitoFee_message = new TransactionMessage({
                payerKey: payer.publicKey,
                recentBlockhash: lastestBlockhash.blockhash,
                instructions: [
                    SystemProgram.transfer({
                        fromPubkey: payer.publicKey,
                        toPubkey: jito_validator_wallet,
                        lamports: jitofee,
                    }),
                ],
            }).compileToV0Message();

            const jitoFee_transaction = new VersionedTransaction(jitoFee_message);
            jitoFee_transaction.sign([payer]);

            const serializedJitoFeeTransaction = bs58.encode(jitoFee_transaction.serialize());
            const serializedTransaction = bs58.encode(transaction.serialize());

            const final_transaction = [
                serializedJitoFeeTransaction,
                serializedTransaction,
            ];

            console.log(chalk.cyan.bold.underline("Sending JITO bundles..."));

            const { data } = await axios.post('https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles', {
                jsonrpc: "2.0",
                id: 1,
                method: "sendBundle",
                params: [final_transaction],
            });

            if (data) {
                return true;
            }
            else {
                return false;
            }

        } catch (e) {
            if (e instanceof axios.AxiosError) {
                console.log("Failed to execute the jito transaction");
            } else {
                console.log("Error during jito transaction execution: ", e);
            }
            return false;
        }
    },

    getRandomValidator: async () => {
        const res =
            jito_Validators[Math.floor(Math.random() * jito_Validators.length)];
        return new PublicKey(res);
    },

}


module.exports = SolanaNetwork;