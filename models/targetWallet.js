const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const targetWalletSchema = new Schema({
    chatId: { type: Number, required: true },
    address: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'false' }
});

const TargetWallet = mongoose.model("targetWallet", targetWalletSchema);

module.exports = TargetWallet;