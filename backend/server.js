// Setting up dotenv so values from .env can be used in code without exposing secrets
require('dotenv').config();

// Setting up database used in project
const db = require('./database');

// Setting up libraries used in project
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createNoise2D } = require('simplex-noise');

const app = express();

// Setting up crypto map
let stocks = new Map();
stocks.set('COINBASE:BTC-USD', {name: 'Bitcoin', symbol: 'BTC'});
stocks.set('COINBASE:ETH-USD', {name: 'Ethereum', symbol: 'ETH'});
stocks.set('COINBASE:XRP-USD', {name: 'XRP', symbol: 'XRP'});
stocks.set('COINBASE:SOL-USD', {name: 'Solana', symbol: 'SOL'});
stocks.set('COINBASE:DOGE-USD', {name: 'Dogecoin', symbol: 'DOGE'});
stocks.set('NOIS', {name: 'Noise', symbol: 'NOIS'})

// Allows communictation between frontend and backend without errors
// http://127.0.0.1:5500 only used for local testing REMOVE BEFORE HANDING IN
app.use(cors({
    origin: ['https://benfrancis08.github.io', 'http://127.0.0.1:5500']
}));

// API Stock Calling - Uses Finnhub (60 api calls per min)
async function updatePrices() {
    for (let [key, value] of stocks) {
        let response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${key}&token=${process.env.FINNHUB_KEY}`);
        
        await db.appendCryptoPrice(value.symbol, response.data.c);
        
        value.price = db.getCryptoPrices(value.symbol);
        stocks.set(key, value);
    }
}

// Function to automatically fetch the stock price every 10 seconds
async function autoUpdatePrice() {
    await updatePrices();
    setTimeout(autoUpdatePrice, 10000);
}


// Variables used for the noise stock
let noisePriceArray = [];
let time = 0;
let noisePrice;
const TIME_SCALE = 0.05;
const VOLATILITY = 5;

let tempPrice = db.getNoisPrices();
if (tempPrice.length === 0) {
    noisePrice = 200;
}
else {
    noisePrice = tempPrice[tempPrice.length - 1];
}

const noise2D = createNoise2D();

// Creates the prices based of the noise value and pushes it into a array then gets an updated price every 5 sec
function noiseStock() {
    let n = noise2D(time, 0);
    let change = VOLATILITY * n;
    change += 0.1;
    noisePrice += change;
    if (noisePrice < 0) {
        noisePrice = 0;
    }

    noisePrice = Math.round(noisePrice*100)/100
    db.appendNoisPrice(noisePrice);

    time += TIME_SCALE;

    // Setting the price object and coresponding price into the 'NOIS' map value
    let value = stocks.get('NOIS');
    value.price = db.getNoisPrices();
    
    // Getting noise alltime highs/lows from db
    let stats = db.getNoisStats();
    let high = stats.alltime_high;
    let low = stats.alltime_low;
    
    // Setting the high/low object and coresponding price into the 'NOIS' map value
    value.high = high;
    value.low = low;

    // Reseting the new value into the 'NOIS' map
    stocks.set('NOIS', value);

    setTimeout(noiseStock, 5000);
}

// '/prices' endpoint displays all stocks and its price
app.get('/prices', (req, res) => {
    // Creates a object consisting of all map keys and its coresponding value
    let object = Object.fromEntries(stocks);
    res.json(object);
})

// '/buy' endpoint to buy stocks
app.get('/buy/:symbol/:amount', (req, res) => {
    let symbol = req.params.symbol.toUpperCase();
    let amount = req.params.amount;
    let currentPrice;

    let tempNoise = stocks.get(symbol);
    currentPrice =tempNoise.price[tempNoise.price.length - 1];

    try {
        db.executeTrade(symbol, 'buy', amount, currentPrice);
        res.json({success: true, message: `Successfully bought ${amount} shares of ${symbol}`});
    } 
    catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
})

// '/sell' endpoint to sell stocks
app.get('/sell/:symbol/:amount', (req, res) => {
    let symbol = req.params.symbol.toUpperCase();
    let amount = req.params.amount;
    let currentPrice;

    let tempNoise = stocks.get(symbol);
    currentPrice =tempNoise.price[tempNoise.price.length - 1];

    try {
        db.executeTrade(symbol, 'sell', amount, currentPrice);
        res.json({success: true, message: `Successfully bought ${amount} shares of ${symbol}`});
    } 
    catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
})

// Creates a server that listens for above endpoints and starts the autoUpdatePrice and noiseStock loop functions
app.listen(process.env.PORT, async () => {
    await autoUpdatePrice();
    noiseStock();
    console.log(`Started\nRunning on http://localhost:${process.env.PORT}`);
})
