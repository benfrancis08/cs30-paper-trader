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

// Setting up stocks map
let stocks = new Map();
stocks.set('AAPL', {name: 'Apple Inc.'});
stocks.set('NVDA', {name: 'NVIDIA Corp.'});
stocks.set('AMZN', {name: 'Amazon Inc.'});
stocks.set('MSFT', {name: 'Microsoft Corp.'});
stocks.set('GOOG', {name: 'Google LLC'});
stocks.set('NOIS', {name: 'Noise'})

// Allows communictation between frontend and backend without errors
// http://127.0.0.1:5500 only used for local testing REMOVE BEFORE HANDING IN
app.use(cors({
    origin: ['https://benfrancis08.github.io', 'http://127.0.0.1:5500']
}));

// API Stock Calling - Uses Finnhub (60 api calls per min)
async function updatePrices() {
    for (let [key, value] of stocks) {
        let response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${key}&token=${process.env.FINNHUB_KEY}`);
        value.price = response.data.c;
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
let noisePrice = 200;
let time = 0;
let timeScale = 0.05;
let volatility = 5;
const noise2D = createNoise2D();

// Creates the prices based of the noise value and pushes it into a array then gets an updated price every 5 sec
function noiseStock() {
    let n = noise2D(time, 0);
    let change = volatility * n;
    change += 0.1;
    noisePrice += change;
    if (noisePrice < 0) {
        noisePrice = 0;
    }

    db.appendNoisPrice(noisePrice.toFixed(2));

    // noisePriceArray.push(noisePrice.toFixed(2));
    time += timeScale;

    let value = stocks.get('NOIS');
    value.price = db.getNoisPrices();

    stocks.set('NOIS', value);
    setTimeout(noiseStock, 5000);
}

// '/prices' endpoint displays all stocks and its price
app.get('/prices', (req, res) => {
    // Creates a object consisting of all map keys and its coresponding value
    let object = Object.fromEntries(stocks);
    res.json(object);
})

// '/prices/:symbol' endpoint displays only requested stock (Ex. '/prices/aapl' will give only the price for apple)

// app.get('/prices/:symbol', (req, res) => {
//     let symbol = req.params.symbol.toUpperCase();
//     let stock = stockPrices.find(s => s.stock === symbol);
//     if (stock === undefined) {
//         res.json(`Stock not found. Please choose from this list: ${STOCKS}`);
//     }
//     else {
//         res.json(stock);
//     }
// });

// Creates a server that listens for above endpoints and starts the autoUpdatePrice and noiseStock loop functions
app.listen(process.env.PORT, async () => {
    await autoUpdatePrice();
    noiseStock();
    console.log(`Started\nRunning on http://localhost:${process.env.PORT}`);
})
