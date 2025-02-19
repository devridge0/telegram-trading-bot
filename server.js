const init = require('./bot/bot');
const chalk = require('chalk')
const connectDB = require('./config/db');
const { StartCopyTrading, WS } = require('./services/copytradingServices');
const fetchTokenLaunchNews = require('./services/x-news');

const StartBot = () => {
   console.log(chalk.red.bold.italic.underline('🤖 Let start with BOT 🤖.'));
   connectDB();
   init();
   StartCopyTrading();
}
StartBot()
