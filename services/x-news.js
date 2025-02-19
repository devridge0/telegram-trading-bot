const { TwitterApi } = require('twitter-api-v2');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const { QUERY, TWITTER_SEARCH_OBJ, LAUNCHPAD_KEYWORDS } = require('./constants.js');
const { burnMyTokenSOL, JUPITER_TOKN_SWAP } = require('./solana');
const WalletDBAccess = require('../db/wallet-db-access');
require('dotenv').config();

const X_API_KEY = process.env.X_API_KEY;
const X_SECRET_KEY = process.env.X_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
    polling: {
        interval: 1000,    // Fetch updates every 1 second
        autoStart: true,
        params: {
            allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post", "inline_query", "chosen_inline_result", "callback_query", "shipping_query", "pre_checkout_query", "poll", "poll_answer"] // Clears previous updates
        }
    }
});

// Step 1: Get OAuth 2.0 Bearer Token
const getBearerToken = async () => {
    try {
        const response = await fetch('https://api.twitter.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${X_API_KEY}:${X_SECRET_KEY}`).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });

        const data = await response.json();
        if (data.access_token) {
            console.log('Successfully obtained Bearer Token.');
            return data.access_token;
        } else {
            throw new Error('Failed to retrieve bearer token.');
        }
    } catch (error) {
        console.error('Error getting bearer token:', error.message);
        return null;
    }
};

// Step 2: Use Bearer Token to Authenticate Twitter API Client
const initTwitterClient = async () => {
    const bearerToken = await getBearerToken();
    if (!bearerToken) {
        console.error('Could not authenticate Twitter API.');
        return null;
    }
    return new TwitterApi(bearerToken);
};

// Step 3: Fetch Tweets Using the Twitter API v2
const fetchTokenLaunchNews = async (chatId) => {
    const client = await initTwitterClient();
    if (!client) return;
    try {
        const tweetsData = await client.v2.search(QUERY, TWITTER_SEARCH_OBJ);

        if (tweetsData?._realData?.data) {
            processTweets(tweetsData._realData.data, chatId);
        } else {
            console.log('No relevant tweets found.');
        }
    } catch (error) {
        console.error('Error fetching tweets:', error);
    }
};

const escapeMarkdown = (text) => {
    return text
        .replace(/_/g, '\\_')   // Escape underscore
        .replace(/\*/g, '\\*')  // Escape asterisk
        .replace(/\[/g, '\\[')  // Escape [
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
        .replace(/!/g, '\\!');   // Escape !
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

const processTweets = async (tweets, chatId) => {
    let tokensAddressesList = [];
    for (const tweet of tweets) {
        // if (tweet.text.startsWith('RT')) continue;
        // const fullTweet = await fetchFullTweet(tweet.id);
        // if (fullTweet) {
        const containsLaunchpad = LAUNCHPAD_KEYWORDS.some(keyword => tweet.text.includes(keyword));
        const tokenAddress = extractTokenAddress(tweet.text);
        tokensAddressesList.push(tokenAddress);

        if (containsLaunchpad) {
            await sendTweetToTelegram(tweet);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // }
    }
    console.log(`NEWS TOKEN buy chatId ------------------\n ${chatId}`)

    const findUserWallet = await WalletDBAccess.findWallet(chatId);
    tokensAddressesList = tokensAddressesList.filter((x) => x !== null);
    tokensAddressesList.map(async (tokenAddress) => {
        const result = await JUPITER_TOKN_SWAP(tokenAddress, findUserWallet.privateKey, findUserWallet.buyAmount, findUserWallet.slippage, findUserWallet.jitoTip, 'buy')
        console.log(`NEWS TOKEN buy result ------------------\n ${result}`)
    })
};

const sendTweetToTelegram = async (tweetData) => {
    try {
        const { id, text, created_at, author_id, public_metrics, entities } = tweetData;

        // Extract author mention if available
        const authorMention = entities?.mentions?.[0]?.username
            ? `👤 *Author:* [@${entities?.mentions[0].username}](https://twitter.com/${entities.mentions[0].username})`
            : `👤 *Author ID:* ${author_id}`;

        // Format tweet text while escaping MarkdownV2 special characters
        const formattedText = escapeMarkdown(text);

        // Tweet URL
        const tweetUrl = `🔗 [View Tweet](https://twitter.com/i/web/status/${id})`;

        // Extract embedded link (if any)
        let embeddedLink = "";
        if (entities?.urls && entities?.urls.length > 0) {
            const { expanded_url, title } = entities?.urls[0];
            embeddedLink = `🌐 *Source:* [${escapeMarkdown(title)}](${escapeMarkdown(expanded_url)})`;
        }

        // Extract image if available
        let imageUrl = null;
        if (entities?.urls?.[0]?.images?.[0]?.url) {
            imageUrl = entities?.urls[0].images[0].url;
        }

        // Public metrics
        const metrics = `🔄 *Retweets:* ${public_metrics.retweet_count}   💬 *Replies:* ${public_metrics.reply_count}   ❤️ *Likes:* ${public_metrics.like_count}`;

        // Construct the text message
        const message = `🚀 *New Tweet Found* 🚀\n\n` +
            `${authorMention}\n` +
            `🕒 *Date:* ${escapeMarkdown(created_at)}\n\n` +
            `📜 *Tweet:* ${formattedText}\n\n` +
            `${metrics}\n\n` +
            `${tweetUrl}\n` +
            (embeddedLink ? `${embeddedLink}\n` : "");


        // Then, send the formatted text message
        await bot.sendMessage(CHAT_ID, message, { parse_mode: "MarkdownV2" });

    } catch (error) {
    }
};


setInterval(fetchTokenLaunchNews, 15 * 60 * 1000); // Runs every 15 minutes
// Run function
module.exports = fetchTokenLaunchNews;
