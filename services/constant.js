exports.LAUNCHPAD_KEYWORDS = ['Pump.fun', 'Raydium', 'Fairlaunch', 'IDO', 'Presale', 'SOL'];

exports.QUERY = 'Solana new token launch OR Solana presale OR Solana IDO OR Pump.fun OR Raydium';

exports.TWITTER_SEARCH_OBJ = {
    max_results: 10,
    'tweet.fields': ['created_at', 'text', 'lang', 'public_metrics', 'conversation_id', 'entities'],
    'user.fields': ['username', 'name', 'profile_image_url'],
    'media.fields': ['url', 'preview_image_url'],
    expansions: ['author_id', 'attachments.media_keys', 'referenced_tweets.id'],
};