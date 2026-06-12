// CS30 Paper Trader
// Ben Francis
// June 12, 2026
//
// Extra for Experts:
// - Explored running a backend on a server
// - Explored using node and express.js to create the backend and a url to fetch and send data to through json format
// - Explored using cors to whitelist my github page to allow only the github page the frontend is hosted on to fetch data
// - Explored making home server accessable on the internet through a tailscale funnel
// - Created a system daemon to start tailscale funnel and backend thought node on server start
// - Explored creating a global textbox with createInput to allow typing inside of my project without using a web alert/input
// - Explored convering maps to objects and vise versa to send through json format

// Variables used in project
let currentTime;
let buySellTime;
let price;
let buttons = undefined;
let buySellButtons;
let priceAmountButtons;
let tempNoise;
let textBox;
let buying = false;
let selling = false;
let clicked = undefined;
let noisePrice = [];
let amountClicked = true;
let priceClicked = false;
let transactionPossible = false;
let transaction = undefined;
let displayingUser = false;
let tradeMessage = '';
let userBalance = 0;
let userHoldings = [];
let transactionHistory = [];
let loaded = false;

let BUTTON_WIDTH;
let BUTTON_HEIGHT;

const SERVER_URL = 'https://pine64.tailb67b61.ts.net';

let stocks = new Map();

// Sets up variables and initializes stock and user data as well as the textBox input
async function setup() {
  createCanvas(windowWidth, windowHeight);
  currentTime = millis();
  buySellTime = millis();

  await getStocks();
  await getUserData();
  
  loaded = true;

  BUTTON_WIDTH = width/6;
  BUTTON_HEIGHT = height/10;
  
  buttons = [
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT/2, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*1.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*2.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*3.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*4.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*5.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: height - BUTTON_HEIGHT/2, w: BUTTON_WIDTH, h: BUTTON_HEIGHT, i: 'User'}
  ];
  buySellButtons = [
    {x: width*1/3, y: height*5/6, w: BUTTON_WIDTH, h: BUTTON_HEIGHT, c: 'green', l: 'Buy'},
    {x: width*2/3, y: height*5/6, w: BUTTON_WIDTH, h: BUTTON_HEIGHT, c: 'red', l: 'Sell'}
  ];
  priceAmountButtons = [
    {x: width/2 - BUTTON_WIDTH/3, y: height/2.2, w: BUTTON_WIDTH/1.5, h: BUTTON_HEIGHT/3, l: 'Amount'},
    {x: width/2 + BUTTON_WIDTH/3, y: height/2.2, w: BUTTON_WIDTH/1.5, h: BUTTON_HEIGHT/3, l: 'Price'}
  ];
  
  textBox = createInput();
  textBox.center();
  textBox.hide();

  textAlign(CENTER, CENTER);
  rectMode(CENTER);
}

// Main draw loop calls all functions needed to create project
function draw() {
  // Checks if first data is pulled from server else displaying 'Loaiding from server' text
  if (!loaded) {
    background(220);
    textAlign(CENTER, CENTER);
    text('Loading from server', width/2, height/2);
  }
  else {
    background(220);
    if (millis() > currentTime + 5000) {
      currentTime = millis();
      getStocks();
    }
  
    if (displayingUser) {
      displayUser();
    }
    else if (clicked === 'NOIS') {
      createButtons();
      noiseGraph();
    }
    else if (clicked !== undefined) {
      createButtons();
      cryptoGraph(clicked);
    }
    if (buying) {
      buy();
    }
    if (selling) {
      sell();
    }
  
    if (tradeMessage !== '' && millis() > buySellTime + 1500) {
      tradeMessage = '';
      buying = false;
      selling = false;
      textBox.hide();
    }

    createButtons();
  }
}

// Pulls stock data from backend 
async function getStocks() {
  try {
    let stockPrices = await fetch(`${SERVER_URL}/prices`);
    price = await stockPrices.json();

    // Converts object from json back into map
    for (let [symbol, value] of Object.entries(price)) {
      stocks.set(symbol, value);
    }

    let tempCheck = stocks.get('NOIS');
    if (tempCheck.price === 0 && noisePrice.length === 0) {
      tempNoise = 'Loading';
    }
    else if (tempCheck.price === 0 && noisePrice.length !== 0) {
      tempNoise = noisePrice;
    }
    else {
      tempNoise = stocks.get('NOIS');
    }
  }
  catch(error) {
    console.log("something went wrong " + error);
  }
} 

// Pulls user data from backend
async function getUserData() {
  try {
    let userResponse = await fetch(`${SERVER_URL}/user`);
    let userData = await userResponse.json();
    userBalance = userData.cash_balance;

    let holdingsResponse = await fetch(`${SERVER_URL}/holdings`);
    userHoldings = await holdingsResponse.json();
    // Removes stocks that have less that 0.0001 holding from frontend map to prevent issues with rounding
    userHoldings = userHoldings.filter((holding) => holding.quantity > 0.0001);

    let transactionResponse = await fetch(`${SERVER_URL}/transactions`);
    transactionHistory = await transactionResponse.json();
  } 
  catch (error) {
    console.log("something went wrong " + error);
  }
}

// Creates all buttons and displays them on canvas
function createButtons() {
  if (buttons !== undefined) {
    textSize(buttons[0].w/8);
    let index = 0;
    for (let [key, value] of stocks) {
      if (mouseIsInButton(buttons[index])) {
        fill(100);
      }
      else {
        fill(255);
      }
      
      let currentPrice = 'Price loading...';
      if (value.price && Array.isArray(value.price) && value.price.length > 0) {
        currentPrice = value.price[value.price.length - 1];
        currentPrice = currentPrice.toFixed(2);
      }

      stroke(0);
      rect(buttons[index].x, buttons[index].y, buttons[index].w, buttons[index].h);

      fill(0);
      noStroke();
      if (key !== 'NOIS') {
        text(`${value.name}\n$${currentPrice}`, buttons[index].x, buttons[index].y);
      }
      else {
        if (tempNoise === 'Loading') {
          text(`${value.name}\nPrice Loading...`, buttons[index].x, buttons[index].y);
        }
        else {
          text(`${value.name}\n$${currentPrice}`, buttons[index].x, buttons[index].y);
        }
      }

      buttons[index].i = key;
      index ++;
    }

    let button = buttons[buttons.length - 1];
    if (mouseIsInButton(button)) {
      fill(100);
    }
    else {
      fill(255);
    }
    stroke(0);
    rect(button.x, button.y, button.w, button.h);
    noStroke();
    fill(0);
    text(`You\n${userBalance.toFixed(2)}`, button.x, button.y);


    if (clicked !== undefined && !displayingUser) {
      const RESIZING_FACTOR = 25;
      for (let button of buySellButtons) {

        if (mouseIsInButton(button)) {
          button.w = BUTTON_WIDTH + RESIZING_FACTOR;
          button.h = BUTTON_HEIGHT + RESIZING_FACTOR;
        }
        else {
          button.w = BUTTON_WIDTH;
          button.h = BUTTON_HEIGHT;
        }

        fill(button.c);
        rect(button.x, button.y, button.w, button.h);
        fill(0);
        textSize(button.w/4);
        text(button.l, button.x, button.y);
      }
    }
  }
  else {
    return;
  }
}

// Sets up noise graph for noise stock not crypto stocks
function noiseGraph() {
  // Sets up the square where the graph will be
  let w;
  if (width > height) {
    w = height/2;
  }
  else {
    w = width/2;
  }
  fill(255);
  noStroke();
  rect(width/2, height/3, w*1.15, w);
  
  // Ends function if stocks is currently being called/updated from backend
  if (tempNoise === 'Loading') {
    fill(0);
    text('Price Loading...', width/2, height/3);
    return;
  }
  else if (Array.isArray(tempNoise)) {
    noisePrice = tempNoise;
  }
  else {
    noisePrice = [];
    for (let price of tempNoise.price) {
      price = parseFloat(price);
      noisePrice.push(price);
    }
  }

  // Built in function returns the max/min of prices array
  let minP = min(noisePrice);
  let maxP = max(noisePrice);

  // Sets up variables needed to create the graph
  const PADDING = w * 0.1;
  const GRAPH_LEFT = width/2 - w/2 + PADDING;
  const GRAPH_RIGHT = width/2 + w/2 - PADDING;
  const GRAPH_TOP = height/3 - w/2 + PADDING;
  const GRAPH_BOTTOM = height/3 + w/2 - PADDING;
  const TEXT_SIZE_FACTOR = 0.04;
  const LINE_DASH_SPACE = 10;
  const PRICE_PADDING = 5;
  const MIN_Y = GRAPH_BOTTOM - PADDING/2;
  const MAX_Y = GRAPH_TOP + PADDING/2;
  
  // Creates labels for min/max on y axis
  textSize(w*TEXT_SIZE_FACTOR);
  textAlign(RIGHT, CENTER);
  noStroke();
  fill(0);
  drawingContext.setLineDash([LINE_DASH_SPACE, LINE_DASH_SPACE]);
  stroke('green');
  line(GRAPH_LEFT, MAX_Y, GRAPH_RIGHT, MAX_Y);
  noStroke();
  text(`$${maxP}`, GRAPH_LEFT - PRICE_PADDING, MAX_Y);
  
  stroke('red');
  line(GRAPH_LEFT, MIN_Y, GRAPH_RIGHT, MIN_Y);
  noStroke();
  text(`$${minP}`, GRAPH_LEFT - PRICE_PADDING, MIN_Y);
  textAlign(CENTER, CENTER);
  stroke(0);
  drawingContext.setLineDash([]);
  
  // Sets up x and y axis for graph
  stroke(0);
  line(GRAPH_LEFT, GRAPH_BOTTOM, GRAPH_RIGHT, GRAPH_BOTTOM); // x axis
  line(GRAPH_LEFT, GRAPH_TOP, GRAPH_LEFT, GRAPH_BOTTOM); // y axis


  // Creates a single shape consiting all 200 points with lines connecting them
  fill(255);
  beginShape();
  for (let i = 0; i < noisePrice.length; i++) {
    let x = map(i, 0, noisePrice.length - 1, GRAPH_LEFT, GRAPH_RIGHT);
    let y = map(noisePrice[i], minP, maxP, GRAPH_BOTTOM - PADDING/2, GRAPH_TOP + PADDING/2);
    vertex(x, y);
  }
  endShape();

  // Creates current price on right side of graph
  fill(0);
  noStroke();
  let currentPriceY = map(noisePrice[noisePrice.length - 1], minP, maxP, GRAPH_BOTTOM - PADDING/2, GRAPH_TOP + PADDING/2);
  text(`$${noisePrice[noisePrice.length - 1]}`, GRAPH_RIGHT + PADDING - PRICE_PADDING, currentPriceY);

  // Creates alltime high/low values on top and bottom
  let value = stocks.get('NOIS');
  text(`Alltime High: $${value.high}`, width/2, GRAPH_TOP - PADDING/2);
  text(`Alltime Low: $${value.low}`, width/2, GRAPH_BOTTOM + PADDING/2);
}

// Sets up graph for all crypto stocks not noise
function cryptoGraph(symbol) {
  // Sets up the square where the graph will be
  let w;
  if (width > height) {
    w = height/2;
  }
  else {
    w = width/2;
  }
  fill(255);
  noStroke();
  rect(width/2, height/3, w*1.15, w);
  
  // Initializes price into a cryptoPrice array
  let tempPrice = stocks.get(symbol);
  let cryptoPrice = [];
  
  for (let price of tempPrice.price) {
    let temp = parseFloat(price);
    cryptoPrice.push(temp);
  }

  // Built in function returns the max/min of prices array
  let minP = min(cryptoPrice);
  let maxP = max(cryptoPrice);

  // Sets up variables needed to create the graph
  const PADDING = w * 0.1;
  const GRAPH_LEFT = width/2 - w/2 + PADDING;
  const GRAPH_RIGHT = width/2 + w/2 - PADDING;
  const GRAPH_TOP = height/3 - w/2 + PADDING;
  const GRAPH_BOTTOM = height/3 + w/2 - PADDING;
  const TEXT_SIZE_FACTOR = 0.04;
  const LINE_DASH_SPACE = 10;
  const PRICE_PADDING = 5;
  const MIN_Y = GRAPH_BOTTOM - PADDING/2;
  const MAX_Y = GRAPH_TOP + PADDING/2;
  
  // Creates labels for min/max on y axis
  textSize(w*TEXT_SIZE_FACTOR);
  textAlign(RIGHT, CENTER);
  noStroke();
  fill(0);
  drawingContext.setLineDash([LINE_DASH_SPACE, LINE_DASH_SPACE]);
  stroke('green');
  line(GRAPH_LEFT, MAX_Y, GRAPH_RIGHT, MAX_Y);
  noStroke();
  text(`$${maxP}`, GRAPH_LEFT - PRICE_PADDING, MAX_Y);
  
  stroke('red');
  line(GRAPH_LEFT, MIN_Y, GRAPH_RIGHT, MIN_Y);
  noStroke();
  text(`$${minP}`, GRAPH_LEFT - PRICE_PADDING, MIN_Y);
  textAlign(CENTER, CENTER);
  stroke(0);
  drawingContext.setLineDash([]);
  
  // Sets up x and y axis for graph
  stroke(0);
  line(GRAPH_LEFT, GRAPH_BOTTOM, GRAPH_RIGHT, GRAPH_BOTTOM); // x axis
  line(GRAPH_LEFT, GRAPH_TOP, GRAPH_LEFT, GRAPH_BOTTOM); // y axis


  // Creates a single shape consiting all 200 points with lines connecting them
  fill(255);
  beginShape();
  for (let i = 0; i < cryptoPrice.length; i++) {
    let x = map(i, 0, cryptoPrice.length - 1, GRAPH_LEFT, GRAPH_RIGHT);
    let y = map(cryptoPrice[i], minP, maxP, GRAPH_BOTTOM - PADDING/2, GRAPH_TOP + PADDING/2);
    vertex(x, y);
  }
  endShape();

  // Creates current price on right side of graph
  fill(0);
  noStroke();
  let currentPriceY = map(cryptoPrice[cryptoPrice.length - 1], minP, maxP, GRAPH_BOTTOM - PADDING/2, GRAPH_TOP + PADDING/2);
  text(`$${cryptoPrice[cryptoPrice.length - 1]}`, GRAPH_RIGHT + PADDING - PRICE_PADDING, currentPriceY);
}

// buy function handles buy popup and buy logic/sending to backend
async function buy() {
  // Sets up variables used in the buy function
  let w;
  let purchacePrice;
  let purchaceAmount;
  let currentStock = stocks.get(clicked);

  let currentPrice = currentStock.price[currentStock.price.length - 1];
  let stockAmount = 0;
  // sets the stockAmount to the current stock quantity
  for (let holding of userHoldings) {
    if (holding.symbol === clicked) {
      stockAmount = holding.quantity;
    }
  }

  // Sets up and creates buy popup
  if (width > height) {
    w = height/1.6;
  }
  else {
    w = width/1.6;
  }
  
  const PADDING = 15;
  const TEXT_SIZE_FACTOR = 0.05;
  
  fill(255);
  stroke(0);
  rect(width/2, height/2, w, w/2);
  
  // Creates text on buy popup
  fill('green');
  noStroke();
  textSize(w*TEXT_SIZE_FACTOR);
  text('Buy', width/2, height/2 - w/4 + PADDING * 2);

  fill(0);
  noStroke();
  textSize(w*0.035);
  text(`Balance:\n$${userBalance.toFixed(2)}`, width/2 - w/3, height/2 - w/8);
  text(`Current price:\n$${currentPrice.toFixed(2)}`, width/2 + w/3, height/2 - w/8);
  if (amountClicked) {
    text(`Amount owned:\n${stockAmount.toFixed(4)}`, width/2 - w/3, height/2 + w/8);
  }
  else {
    text(`Price owned:\n$${(currentPrice*stockAmount).toFixed(2)}`, width/2 - w/3, height/2 + w/8);
  }

  // Sets up buy max button
  let maxButton = {
    x: width/2 + w/3,
    y: height/2 + w/8,
    w: BUTTON_WIDTH/1.5,
    h: BUTTON_HEIGHT/3,
    l: 'Buy Max'
  };

  // Displays buy max button and sets textbox value to max amount when clicked
  if (mouseIsPressed && mouseIsInButton(maxButton)) {
    let maxAmount = userBalance/currentPrice;
    let roundedMaxAmount = Math.floor(maxAmount*10000)/10000;
    if (amountClicked) {
      textBox.value(roundedMaxAmount.toFixed(4));
    }
    else {
      textBox.value((roundedMaxAmount*currentPrice).toFixed(2));
    }
  }

  if (mouseIsInButton(maxButton)) {
    fill('green');
  }
  else {
    fill(0, 255, 0, 100);
  }

  stroke(0);
  rect(maxButton.x, maxButton.y, maxButton.w, maxButton.h);
  fill(0); 
  noStroke(); 
  textSize(maxButton.w/6);
  text(maxButton.l, maxButton.x, maxButton.y);

  // Buttons to swap between buying off price and amount
  for (let button of priceAmountButtons) {
    if (mouseIsPressed) {
      if (mouseIsInButton(button) && button.l === 'Amount') {
        amountClicked = true;
        priceClicked = false;
      }
      if (mouseIsInButton(button) && button.l === 'Price') {
        priceClicked = true;
        amountClicked = false;
      } 
    }

    if (amountClicked && button.l === 'Amount' || priceClicked && button.l === 'Price') {
      fill(100);
    }
    else {
      fill(255);
    }

    // Displays buy button
    stroke(0);
    rect(button.x, button.y, button.w, button.h);

    noStroke();
    fill(0);
    textSize(button.w/6);
    text(button.l, button.x, button.y);
  }

  textBox.show();

  // Displays current balance, current holdings, current stock price and a buy instruction on the popup
  if (amountClicked && textBox.value() !== '') {
    purchaceAmount = parseFloat(textBox.value());
    purchacePrice = purchaceAmount * currentStock.price[currentStock.price.length - 1];
    text(`$${purchacePrice.toFixed(2)}`, width/2, height/2 + PADDING*2);
  }

  if (priceClicked && textBox.value() !== '') {
    purchacePrice = parseFloat(textBox.value());
    purchaceAmount = purchacePrice/currentStock.price[currentStock.price.length - 1];
    text(`${purchaceAmount.toFixed(4)} Shares`, width/2, height/2 + PADDING*2);
  }

  if (purchaceAmount >= 0.0001) {
    transactionPossible = true;
    text('Press ENTER to place order', width/2, height/1.6 - PADDING*2);
  }
  else {
    transactionPossible = false;
    text('Enter a valid price or amount', width/2, height/1.6 - PADDING*2);
  }

  // Displays message after buying
  if (tradeMessage !== '') {
    textBox.hide();
    fill(255);
    stroke(0);
    rect(width/2, height/2, w, w/2);
    
    fill('green');
    noStroke();
    textSize(w*TEXT_SIZE_FACTOR);
    text('Buy', width/2, height/2 - w/4 + PADDING * 2);

    fill(0);
    textSize(w*TEXT_SIZE_FACTOR);
    text(tradeMessage, width/2, height/2);
  }

  // Sends transaction to backend
  if (transaction === 'Buy') {
    transaction = undefined;
    try {
      let response = await fetch(`${SERVER_URL}/buy/${clicked}/${purchaceAmount}`);
      response = await response.json();
      tradeMessage = response.message;
      buySellTime = millis();
    }
    catch(error) {
      console.log("something went wrong " + error);
    }
  }
  await getUserData();
}

// sell function handles sell popup and sell logic/sending to backend
async function sell() {
  // Sets up variables used in the sell function
  let w;
  let sellPrice;
  let sellAmount;
  let currentStock = stocks.get(clicked);

  let currentPrice = currentStock.price[currentStock.price.length - 1];
  let stockAmount = 0;
  // sets the stockAmount to the current stock quantity
  for (let holding of userHoldings) {
    if (holding.symbol === clicked) {
      stockAmount = holding.quantity;
    }
  }

  // Sets up and creates sell popup
  if (width > height) {
    w = height/1.6;
  }
  else {
    w = width/1.6;
  }
  
  const PADDING = 15;
  const TEXT_SIZE_FACTOR = 0.05;
  
  fill(255);
  stroke(0);
  rect(width/2, height/2, w, w/2);
  
  // Creates text on sell popup
  fill('red');
  noStroke();
  textSize(w*TEXT_SIZE_FACTOR);
  text('Sell', width/2, height/2 - w/4 + PADDING * 2);

  fill(0);
  noStroke();
  textSize(w*0.035);
  text(`Balance:\n$${userBalance.toFixed(2)}`, width/2 - w/3, height/2 - w/8);
  text(`Current price:\n$${currentPrice.toFixed(2)}`, width/2 + w/3, height/2 - w/8);
  if (amountClicked) {
    text(`Amount owned:\n${stockAmount.toFixed(4)}`, width/2 - w/3, height/2 + w/8);
  }
  else {
    text(`Price owned:\n$${(currentPrice*stockAmount).toFixed(2)}`, width/2 - w/3, height/2 + w/8);
  }

  // Sets up sell max button
  let maxButton = {
    x: width/2 + w/3,
    y: height/2 + w/8,
    w: BUTTON_WIDTH/1.5,
    h: BUTTON_HEIGHT/3,
    l: 'Sell Max'
  };

  // Displays sell max button and sets textbox value to max amount when clicked
  if (mouseIsPressed && mouseIsInButton(maxButton)) {
    let roundedStockAmount = Math.floor(stockAmount*10000)/10000;
    if (amountClicked) {
      textBox.value(roundedStockAmount.toFixed(4));
    }
    else {
      textBox.value((roundedStockAmount*currentPrice).toFixed(2));
    }
  }

  if (mouseIsInButton(maxButton)) {
    fill('red');
  }
  else {
    fill(255, 0, 0, 100);
  }

  stroke(0);
  rect(maxButton.x, maxButton.y, maxButton.w, maxButton.h);
  fill(0); 
  noStroke(); 
  textSize(maxButton.w/6);
  text(maxButton.l, maxButton.x, maxButton.y);

  // Buttons to swap between sell off price and amount
  for (let button of priceAmountButtons) {
    if (mouseIsPressed) {
      if (mouseIsInButton(button) && button.l === 'Amount') {
        amountClicked = true;
        priceClicked = false;
      }
      if (mouseIsInButton(button) && button.l === 'Price') {
        priceClicked = true;
        amountClicked = false;
      } 
    }

    if (amountClicked && button.l === 'Amount' || priceClicked && button.l === 'Price') {
      fill(100);
    }
    else {
      fill(255);
    }

    // Displays sell button
    stroke(0);
    rect(button.x, button.y, button.w, button.h);

    noStroke();
    fill(0);
    textSize(button.w/6);
    text(button.l, button.x, button.y);
  }

  textBox.show();

  // Displays current balance, current holdings, current stock price and a buy instruction on the popup
  if (amountClicked && textBox.value() !== '') {
    sellAmount = parseFloat(textBox.value());
    sellPrice = sellAmount * currentStock.price[currentStock.price.length - 1];
    text(`$${sellPrice.toFixed(2)}`, width/2, height/2 + PADDING*2);
  }

  if (priceClicked && textBox.value() !== '') {
    sellPrice = parseFloat(textBox.value());
    sellAmount = sellPrice/currentStock.price[currentStock.price.length - 1];
    text(`${sellAmount.toFixed(4)} Shares`, width/2, height/2 + PADDING*2);
  }

  if (sellAmount >= 0.0001) {
    transactionPossible = true;
    text('Press ENTER to place order', width/2, height/1.6 - PADDING*2);
  }
  else {
    transactionPossible = false;
    text('Enter a valid price or amount', width/2, height/1.6 - PADDING*2);
  }

  // Displays message after buying
  if (tradeMessage !== '') {
    textBox.hide();
    fill(255);
    stroke(0);
    rect(width/2, height/2, w, w/2);
    
    fill('red');
    noStroke();
    textSize(w*TEXT_SIZE_FACTOR);
    text('Sell', width/2, height/2 - w/4 + PADDING * 2);

    fill(0);
    textSize(w*TEXT_SIZE_FACTOR);
    text(tradeMessage, width/2, height/2);
  }

  // Sends transaction to backend
  if (transaction === 'Sell') {
    transaction = undefined;
    try {
      let response = await fetch(`${SERVER_URL}/sell/${clicked}/${sellAmount}`);
      response = await response.json();
      tradeMessage = response.message;
      buySellTime = millis();
    }
    catch(error) {
      console.log("something went wrong " + error);
    }
  }
  await getUserData();
}

// displayUser function displays all user data in a popup
function displayUser() {
  let w = width - BUTTON_WIDTH*2.5;
  let h = height - BUTTON_HEIGHT*2.5;

  // Creates white bg for user info
  fill(255);
  rect(width/2, height/2, w, h);

  // Displays current balance
  fill(0);
  textSize(w*0.04);
  text(`Current Balance: $${userBalance.toFixed(2)}`, width/2, BUTTON_HEIGHT*1.5);
  
  // Sets up main current holdings and transaction history headings
  fill(0);
  noStroke();
  textSize(w*0.03);
  text('Current Holdings', width/2 - w/4, BUTTON_HEIGHT*2);
  text('Transaction History', width/2 + w/4, BUTTON_HEIGHT*2);
  
  // Variables used for current holdings and transaction history boxes
  let boxW = w/2;
  let boxH = h/1.3;
  let leftBoxX = width/2 - w/4;
  let rightBoxX = width/2 + w/4;
  let boxY = height/2;
  
  // Sets up current holdings and transaction history boxes
  fill(220);
  stroke(0);
  rect(leftBoxX, boxY, boxW, boxH);
  rect(rightBoxX, boxY, boxW, boxH);
  
  // Sets up headings for current holdings box
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text('Symbol', leftBoxX - boxW/4, boxY - boxH/2 + 15);
  text('Amount', leftBoxX + boxW/4, boxY - boxH/2 + 15);
  
  // Sets up headings for transaction history box
  text('Symbol', rightBoxX - boxW/3, boxY - boxH/2 + 15);
  text('Type', rightBoxX, boxY - boxH/2 + 15);
  text('Amount', rightBoxX + boxW/3, boxY - boxH/2 + 15);
  
  // Creates line under box subheadings
  stroke(0);
  line(leftBoxX - boxW/2, boxY - boxH/2 + 30, leftBoxX + boxW/2, boxY - boxH/2 + 30);
  line(rightBoxX - boxW/2, boxY - boxH/2 + 30, rightBoxX + boxW/2, boxY - boxH/2 + 30);
  
  // Variables used for displaying current holdings and transaction history
  let rowSpacing = h * 0.05;
  let startY = boxY - boxH/2 + 50; 
  let bottomLimit = boxY + boxH/2 - 15;

  // Displays all current holdings that fit in given box dimensions
  noStroke();
  let currentY = startY;
  for (let holding of userHoldings) {
    if (currentY < bottomLimit) {
      let stock = stocks.get(holding.symbol);
      fill(0);
      text(stock.symbol, leftBoxX - boxW/4, currentY);
      text(holding.quantity.toFixed(4), leftBoxX + boxW/4, currentY);
      currentY += rowSpacing;
    }
  }

  // Displays all transactions that fit in given box dimensions
  currentY = startY;
  for (let transaction of transactionHistory) {
    if (currentY < bottomLimit) {
      let stock = stocks.get(transaction.symbol);

      fill(0);
      text(stock.symbol, rightBoxX - boxW/3, currentY);

      if (transaction.type === 'buy') {
        fill('green'); 
      } 
      else {
        fill('red'); 
      }
      text(transaction.type.toUpperCase(), rightBoxX, currentY);

      fill(0);
      text(transaction.quantity.toFixed(4), rightBoxX + boxW/3, currentY);
      
      currentY += rowSpacing;
    }
  }
}

// Returns a boolean based on if the mouse is in the given button or not
function mouseIsInButton(btn) {
  return mouseX > btn.x - btn.w/2 &&
         mouseX < btn.x + btn.w/2 &&
         mouseY > btn.y - btn.h/2 &&
         mouseY < btn.y + btn.h/2;
}

// Built in function detects if mouseButton is pressed then released
function mouseReleased() {
  for (let button of buttons) {
    if (mouseIsInButton(button)) {
      clicked = button.i;
      if (clicked !== 'User') {
        displayingUser = false;
      }
    }
  }
  if (clicked === 'User') {
    clicked = undefined;
    buying = false;
    selling = false;
    tradeMessage = '';
    textBox.hide();
    displayingUser = !displayingUser;
  }
  else if (clicked !== undefined) {
    if (mouseIsInButton(buySellButtons[0])) {
      buying = !buying;
      selling = false;
      textBox.value('');
      if (!buying) {
        textBox.hide();
        tradeMessage = '';
      }
    }
    if (mouseIsInButton(buySellButtons[1])) {
      selling = !selling;
      buying = false;
      textBox.value('');
      if (!selling) {
        textBox.hide();
        tradeMessage = '';
      }
    }
  }
}

// Built in function detects if a key on keyboard is pressed
function keyPressed() {
  if (keyCode === ENTER && transactionPossible) {
    if (buying) {
      transaction = 'Buy';
    }
    else {
      transaction = 'Sell';
    }
  }
}
