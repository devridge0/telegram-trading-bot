const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const AdminWallet = new Schema({
  adminWallet: { type: String, required: true },
});

const Admin = mongoose.model("Admin", AdminWallet);

module.exports = Admin;