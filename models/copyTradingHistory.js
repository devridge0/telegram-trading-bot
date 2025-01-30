const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const CopyTradingHistorySchema = new Schema({
  userId: { type: String, required: true },
  chatId: { type: Number, required: true },
  sendToken: { type: String },
  receiveToken: { type: String },
  myWallet: { type: String, required: true },
  whaleWallet: { type: String, required: true }
});


const CopyTradingHistory = mongoose.model("CopyTradingHistory", CopyTradingHistorySchema);

module.exports = CopyTradingHistory;