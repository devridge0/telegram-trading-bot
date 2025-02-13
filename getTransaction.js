const ethers = require('ethers');
const BASE_RPC_URL = 'https://mainnet.base.org'; // Or a more specific/reliable provider

const WALLET_ADDRESS = '0x...YOUR_WHALE_WALLET_ADDRESS...'; // Replace with the actual address

async function getTransactions(walletAddress) {
    try {
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

        const transactionCount = await provider.getTransactionCount(walletAddress);
        console.log(`Transaction count for ${walletAddress}: ${transactionCount}`);

        let transactions = [];
        let startBlock = 0; // You can set a start block if needed
        let endBlock = "latest"; // Or a specific block number.

        try {
            transactions = await provider.getTransactions({
                address: walletAddress,
                //startBlock,  // You can specify a block range for efficiency
                //endBlock
            });

        } catch (error) {
            console.error("Error fetching transactions:", error);
            throw error; // Re-throw the error to stop execution.
        }



        // 4. Process the transactions (example: printing transaction hashes)
        console.log(`Transactions for ${walletAddress}:`);
        for (const tx of transactions) {

            console.log(`  Transaction Hash: ${tx.hash}`);
            console.log(`    From: ${tx.from}`);
            console.log(`    To: ${tx.to}`);
            console.log(`    Value (ETH): ${ethers.formatEther(tx.value)}`);
            console.log(`    Timestamp: ${tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : 'Unknown'}`); // Note: This depends on tx.timestamp being available from your provider, it's often not available directly.  You might need to call `provider.getBlock(tx.blockHash)` to fetch this.
            console.log('---');
        }

        console.log(`Found ${transactions.length} transactions.`);


    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
getTransactions(WALLET_ADDRESS);