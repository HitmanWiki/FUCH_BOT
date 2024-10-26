const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual Telegram bot token
const botToken = 'process.env.BOT_TOKEN';
const groupChatId = 'process.env.GROUP_CHAT_ID'; // Your Telegram group chat ID

// Create a bot that uses polling to fetch updates
const bot = new TelegramBot(botToken, { polling: true });

// Function to fetch cryptocurrency price from Dexscreener
async function fetchTokenPrice(tokenAddress = '0xff00FFcbD9701d290000Dc5f5Ce59026773aC704') {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    const response = await axios.get(url);

    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      const pool = response.data.pairs[0];

      const price = pool.priceUsd || 'N/A';
      const volume = pool.volume.h24 ? `$${Number(pool.volume.h24).toLocaleString()}` : 'N/A';
      const change24h = pool.priceChange.h24 ? `${pool.priceChange.h24}%` : 'N/A';
      const liquidity = pool.liquidity.usd ? `$${Number(pool.liquidity.usd).toLocaleString()}` : 'N/A';
      const baseToken = pool.baseToken.symbol || 'N/A';
      const quoteToken = pool.quoteToken.symbol || 'N/A';
      const dexName = pool.dexId || 'N/A';
      const chartUrl = pool.url || '';

      return {
        price,
        volume,
        change24h,
        liquidity,
        baseToken,
        quoteToken,
        dexName,
        chartUrl
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

// Function to send price update
async function sendPriceUpdate(chatId) {
  const tokenData = await fetchTokenPrice();
  if (tokenData) {
    const message = `
📊 **Token Price Update (${tokenData.baseToken}/${tokenData.quoteToken}) on ${tokenData.dexName}** 📊
💰 Price: ${tokenData.price}
📈 24h Volume: ${tokenData.volume}
📊 24h Price Change: ${tokenData.change24h}
🏦 Liquidity: ${tokenData.liquidity}

[View Chart on Dexscreener](${tokenData.chartUrl})
        `;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, 'Failed to fetch token price. Please try again later.');
  }
}

// Function to fetch a joke from JokeAPI
async function fetchJoke() {
  try {
    const response = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single');
    if (response.data && response.data.joke) {
      return response.data.joke;
    } else {
      return "Couldn't fetch a joke right now!";
    }
  } catch (error) {
    console.error('Error fetching joke:', error);
    return "Couldn't fetch a joke right now!";
  }
}

// Function to send a joke to the group
async function sendJoke() {
  const joke = await fetchJoke();
  bot.sendMessage(groupChatId, joke);
}

// Handle the '/start' command to greet the group
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Hello! I will now send jokes regularly and provide token price updates on demand. Use /price to get token price.');
});

// Handle the '/price' command to provide token price
bot.onText(/\/price/, (msg) => {
  const chatId = msg.chat.id;
  sendPriceUpdate(chatId);
});

// Polling to send jokes at regular intervals (e.g., every 30 minutes)
setInterval(() => {
  sendJoke();
}, 1 * 60 * 1000); // Every 30 minutes
