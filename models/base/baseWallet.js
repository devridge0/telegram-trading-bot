const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const BaseWalletSchema = new Schema({
  userId: { type: String, required: true },
  chatId: { type: Number, required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  referral: [
    {
      chatId: Number,
      username: String,
      payAmount: Number
    }

  ],
  referralWallet: { type: String },
  buyAmount: { type: Number, default: 0.005, },
  slippage: { type: Number, default: 25, },
  selltype: { type: String, default: `all` },
  stopLoss: { type: Number, default: 2, },
  takeProfit: { type: Number, default: 5, },
  jitoTip: { type: Number, default: 100000, },
});

const BaseWallet = mongoose.model("BaseWallet", BaseWalletSchema);

module.exports = BaseWallet;