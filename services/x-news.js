const { TwitterApi } = require('twitter-api-v2');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new TwitterApi(process.env.BEARER_TOKEN);
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: {
        interval: 1000,    // Fetch updates every 1 second
        autoStart: true,
        params: {
            allowed_updates: [] // Clears previous updates
        }
    }
});

const chatId = process.env.CHAT_ID;
const LAUNCHPAD_KEYWORDS = ['Pump.fun', 'Raydium', 'Fairlaunch', 'IDO', 'Presale', 'SOL'];

const fetchTokenLaunchNews = async () => {
    try {
        const query = 'Solana new token launch OR Solana presale OR Solana IDO OR Pump.fun OR Raydium';
        const tweetsData = await client.v2.search(query, {
            max_results: 10,
            'tweet.fields': ['created_at', 'text']
        });


        // fs.writeFileSync('tweets.json', JSON.stringify(tweetsData));
        // const tweets = fs.readFileSync('tweets.json', 'utf8');
        // const tweetsData = JSON.parse(tweets);
        // if (tweetsData?._realData?.data) {

        processTweets(tweetsData.data.data);
        // } else {
        //     console.log('No relevant tweets found.');
        // }

    } catch (error) {
        console.error('Error fetching tweets:', error);
    }
};

const fetchFullTweet = async (tweetId) => {
    try {
        const tweetDetails = await client.v2.singleTweet(tweetId, {
            'tweet.fields': ['text'],
        });
        return tweetDetails.data.text;
    } catch (error) {
        console.error(`Error fetching full tweet: ${error}`);
        return null;
    }
};

const extractTokenAddress = (tweetText) => {
    const tokenRegex = /(?:CA[:\s]*)?([A-Za-z0-9]{32,44})/i;
    const contractRegex = /(?:Contract Address[:\s]*|CA[:\s]*)?([A-Za-z0-9]{32,44})/i;
    const contractMatch = tweetText.match(contractRegex);

    const tokenMatch = tweetText.match(tokenRegex);

    if (tokenMatch || contractMatch) {
        return tokenMatch ? tokenMatch[1] : contractMatch ? contractMatch[1] : null;
    }
    return null;
};

const getTokenPrice = async (tokenAddress) => {
    try {
        const options = {
            method: 'GET',
            headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-Jj4aJsUcD7W1nzXr37vsMcmq' }
        };
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenAddress}&vs_currencies`, options);
        const priceData = await response.json();
        console.log(priceData);
        return priceData[tokenAddress]?.usd ? `$${priceData[tokenAddress].usd}` : 'Price not available';
    } catch (error) {
        console.error('Error fetching token price:', error);
        return 'Price not available';
    }
};

const escapeMarkdown = (text) => {
    return text
        .replace(/_/g, '\\_')   // Escape underscore
        .replace(/\*/g, '\\*')  // Escape asterisk
        .replace(/\[/g, '\\[')  // Escape [
        .replace(/\]/g, '\\]')  // Escape ]
        .replace(/\(/g, '\\(')  // Escape (
        .replace(/\)/g, '\\)')  // Escape )
        .replace(/~/g, '\\~')   // Escape ~
        .replace(/`/g, '\\`')   // Escape `
        .replace(/>/g, '\\>')   // Escape >
        .replace(/#/g, '\\#')   // Escape #
        .replace(/\+/g, '\\+')  // Escape +
        .replace(/-/g, '\\-')   // Escape -
        .replace(/=/g, '\\=')   // Escape =
        .replace(/\|/g, '\\|')  // Escape |
        .replace(/\{/g, '\\{')  // Escape {
        .replace(/\}/g, '\\}')  // Escape }
        .replace(/\./g, '\\.')  // Escape .
        .replace(/!/g, '\\!');  // Escape !
};

const processTweets = async (tweets) => {
    for (const tweet of tweets) {
        // if (tweet.text.startsWith('RT')) continue;
        // const fullTweet = await fetchFullTweet(tweet.id);
        // if (fullTweet) {
        const containsLaunchpad = LAUNCHPAD_KEYWORDS.some(keyword => tweet.text.includes(keyword));
        // const tokenAddress = extractTokenAddress(tweet.text);
        if (containsLaunchpad) {
            // const tokenPrice = tokenAddress ? await getTokenPrice(tokenAddress) : 'Not available';
            const message = `🚀 *New Solana Token Launch* 🚀\n 📅${escapeMarkdown(tweet.created_at)}\n\n` +
                `🔹 ${escapeMarkdown(tweet.text)}\n` +
                // `${tokenAddress ? `🔹 *Token Address:* ${tokenAddress}\n 💰 *Price:* ${tokenPrice}\n` : ""}` +
                `🔗 [Tweet Link](https://twitter.com/i/web/status/${tweet.id})`;
            await bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
        }
        // }
    }
};

setInterval(fetchTokenLaunchNews, 15 * 60 * 1000); // Runs every 15 minutes