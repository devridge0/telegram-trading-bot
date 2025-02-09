const BASE_RPC1 = `https://mainnet.base.org`;
const { ethers } = require("ethers");
let provider = new ethers.JsonRpcProvider(BASE_RPC1);


const transferAllEth = async (privateKey, receiverAddress) => {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        // 3. Get the sender's balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`Balance of sender: ${ethers.formatEther(balance)} ETH`);

        // 4. Get Fee Data and Gas Price (using EIP-1559)
        const feeData = await provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas;
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

        if (!maxFeePerGas || !maxPriorityFeePerGas) {
            console.error("Could not retrieve gas price from network");
            return null;
        }

        // 5. Get gas estimate (crucial for accurate cost estimation).  Transfer all balance to estimate.
        const gasLimit = await provider.estimateGas({
            to: receiverAddress,
            value: balance,
        });

        // 6. Calculate the gas cost (using EIP-1559 parameters)
        const gasCost = gasLimit * maxFeePerGas;

        // 7. Calculate the transfer amount (balance - gas cost).  Handle potential for negative values to protect against potential race condition issues
        let transferAmount = balance - gasCost;
        if (transferAmount < 0) {
            console.warn("Gas cost exceeds balance.  Transferring remaining balance.");
            transferAmount = 0; // Or throw an error if you don't want to transfer anything
        }

        // 8. Construct the transaction (value in wei, using EIP-1559)
        const transaction = {
            to: receiverAddress,
            value: transferAmount, // Amount to transfer
            gasLimit: gasLimit,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            nonce: await provider.getTransactionCount(wallet.address, 'latest'),
            chainId: 8453,  // Base chain ID
        };

        // 9. Sign and send the transaction
        const txResponse = await wallet.sendTransaction(transaction);

        console.log("Transaction sent. Waiting for confirmation...");
        const txReceipt = await txResponse.wait(); // Wait for confirmation

        console.log(`Transaction confirmed in block ${txReceipt.blockNumber}`);
        console.log(`Transaction hash: ${txReceipt.hash}`);

        return txReceipt.hash;

    } catch (error) {
        console.error("Error transferring ETH:", error);
        return null; // Return null if an error occurred
    }
}