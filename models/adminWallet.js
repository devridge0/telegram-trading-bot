const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const AdminWalletSchema = new Schema({
  adminWallet: { type: String },
});

const AdminWallet = mongoose.model("AdminWallet", AdminWalletSchema);

module.exports = AdminWallet;