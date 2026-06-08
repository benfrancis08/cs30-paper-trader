// CS30 Paper Trader
// Ben Francis
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let currentTime;
let price;
let buttons;
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

let BUTTON_WIDTH;
let BUTTON_HEIGHT;

let stocks = new Map();

async function setup() {
  createCanvas(windowWidth, windowHeight);
  currentTime = millis();
  await getStocks();
  
  BUTTON_WIDTH = width/6;
  BUTTON_HEIGHT = height/10;
  
  buttons = [
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT/2, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*1.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*2.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*3.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*4.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*5.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT}
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

function draw() {
  background(220);
  if (millis() > currentTime + 5000) {
    currentTime = millis();
    getStocks();
  }

  if (clicked === 'NOIS') {
    createButtons();
    noiseGraph();
  }
  else if (clicked !== undefined) {
    createButtons();
    cryptoGraph(clicked);
  }
  else {
    createButtons();
  }
  if (buying) {
    buy();
  }
  if (selling) {
    sell();
  }
}

async function getStocks() {
  try {
    // Fetch from localhost for testing only. SWITCH TO "https://pine64.tailb67b61.ts.net" BEFORE HANDING IN/TESTING ON SERVER
    let stockPrices = await fetch('http://localhost:3000/prices');
    price = await stockPrices.json();

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

function createButtons() {
  textSize(buttons[0].w/8);
  let index = 0;
  for (let [key, value] of stocks) {
    if (mouseIsInButton(buttons[index])) {
      fill(100);
    }
    else {
      fill(255);
    }
    
    stroke(0);
    rect(buttons[index].x, buttons[index].y, buttons[index].w, buttons[index].h);

    fill(0);
    noStroke();
    if (key !== 'NOIS') {
      let tempPrice = value.price;
      text(`${value.name}\n$${tempPrice[tempPrice.length - 1]}`, buttons[index].x, buttons[index].y);
    }
    else {
      if (tempNoise === 'Loading') {
        text(`${value.name}\nPrice Loading...`, buttons[index].x, buttons[index].y);
      }
      else {
        text(`${value.name}\n$${value.price[value.price.length - 1].toFixed(2)}`, buttons[index].x, buttons[index].y);
      }
    }

    buttons[index].i = key;
    index ++;
  }

  if (clicked !== undefined) {
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

function buy() {
  let w;
  let purchacePrice;
  let currentStock = stocks.get(clicked);

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
  
  fill('green');
  noStroke();
  textSize(w*TEXT_SIZE_FACTOR);
  text('Buy', width/2, height/2 - w/4 + PADDING * 2);

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

    stroke(0);
    rect(button.x, button.y, button.w, button.h);

    noStroke();
    fill(0);
    textSize(button.w/6);
    text(button.l, button.x, button.y);
  }

  textBox.show();

  if (amountClicked) {
    purchacePrice  = textBox.value() * currentStock.price[currentStock.price - 1];
    text(purchacePrice, width/2, height/1.6 - PADDING*2);
  }
}

function sell() {

}

// Returns a boolean based on if the mouse is in the given button or not
function mouseIsInButton(btn) {
  return mouseX > btn.x - btn.w/2 &&
         mouseX < btn.x + btn.w/2 &&
         mouseY > btn.y - btn.h/2 &&
         mouseY < btn.y + btn.h/2;
}

function mouseReleased() {
  for (let button of buttons) {
    if (mouseIsInButton(button)) {
      clicked = button.i;
    }
  }

  if (clicked !== undefined) {
    if (mouseIsInButton(buySellButtons[0])) {
      buying = !buying;
      if (!buying) {
        textBox.hide();
      }
    }
    if (mouseIsInButton(buySellButtons[1])) {
      buying = !buying;
      if (!buying) {
        textBox.hide();
      }
    }
  }
}