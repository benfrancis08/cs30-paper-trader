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
let tempNoise;
let clicked = undefined;
let noisePrice = [];

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
    let tempPrice = stocks.get(clicked);
    textSize(25);
    text(`${clicked}\n$${tempPrice.price}`, width/2, height/2);
  }
  else {
    createButtons();
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
      text(`${value.name}\n$${value.price}`, buttons[index].x, buttons[index].y);
    }
    else {
      if (value.price.length === undefined) {
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
  rect(width/2, height/2, w*1.15, w);
  
  // Ends function if stocks is currently being called/updated from backend
  if (tempNoise === 'Loading') {
    fill(0);
    text('Price Loading...', width/2, height/2);
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
  let minP = min(noisePrice).toFixed(2);
  let maxP = max(noisePrice).toFixed(2);

  // Sets up variables needed to create the graph
  let padding = w * 0.1;
  let graphLeft = width/2 - w/2 + padding;
  let graphRight = width/2 + w/2 - padding;
  let graphTop = height/2 - w/2 + padding;
  let graphBottom = height/2 + w/2 - padding;
  
  // Creates labels for min/max on y axis
  textSize(w*0.04);
  textAlign(RIGHT, CENTER);
  noStroke();
  fill(0);
  drawingContext.setLineDash([10, 10]);
  let minY = graphBottom - padding/2;
  let maxY = graphTop + padding/2;
  stroke('green');
  line(graphLeft, maxY, graphRight, maxY);
  noStroke();
  text(`$${maxP}`, graphLeft - 5, maxY);
  
  stroke('red');
  line(graphLeft, minY, graphRight, minY);
  noStroke();
  text(`$${minP}`, graphLeft - 5, minY);
  textAlign(CENTER, CENTER);
  stroke(0);
  drawingContext.setLineDash([]);
  
  // Sets up x and y axis for graph
  stroke(0);
  line(graphLeft, graphBottom, graphRight, graphBottom); // x axis
  line(graphLeft, graphTop, graphLeft, graphBottom); // y axis


  // Creates a single shape consiting all 200 points with lines connecting them
  fill(255);
  beginShape();
  for (let i = 0; i < noisePrice.length; i++) {
    let x = map(i, 0, noisePrice.length - 1, graphLeft, graphRight);
    let y = map(noisePrice[i], minP, maxP, graphBottom - padding/2, graphTop + padding/2);
    vertex(x, y);
  }
  endShape();

  // Creates current price on right side of graph
  fill(0);
  noStroke();
  let currentPriceY = map(noisePrice[noisePrice.length - 1], minP, maxP, graphBottom - padding/2, graphTop + padding/2);
  text(`$${noisePrice[noisePrice.length - 1]}`, graphRight + padding - 5, currentPriceY);

  // Creates alltime high/low values on top and bottom
  let value = stocks.get('NOIS');
  text(`Alltime High: $${value.high}`, width/2, graphTop - padding/2);
  text(`Alltime Low: $${value.low}`, width/2, graphBottom + padding/2);
}

function buy() {

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
}