const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const BaseTargetWalletSchema = new Schema({
    chatId: { type: Number, required: true },
    address: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'false' }
});

const BaseTargetWallet = mongoose.model("BaseTargetWallet", BaseTargetWalletSchema);

module.exports = BaseTargetWallet;