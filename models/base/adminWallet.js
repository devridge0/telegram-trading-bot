const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const BaseAdminWalletSchema = new Schema({
  adminWallet: { type: String },
});

const BaseAdminWallet = mongoose.model("BaseAdminWallet", BaseAdminWalletSchema);

module.exports = BaseAdminWallet;