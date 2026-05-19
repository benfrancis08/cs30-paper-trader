// CS30 Paper Trader
// Ben Francis
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let currentTime;
let price;
let buttons;
let clicked = undefined;

let stocks = new Map();

async function setup() {
  createCanvas(windowWidth, windowHeight);
  currentTime = millis();
  await getStocks();

  const BUTTON_WIDTH = width/6;
  const BUTTON_HEIGHT = height/10;
  buttons = [
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT/2, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*1.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*2.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*3.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*4.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT},
    {x: BUTTON_WIDTH/2, y: BUTTON_HEIGHT*5.5, w: BUTTON_WIDTH, h: BUTTON_HEIGHT}
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
    text(`${clicked}\n${tempPrice.price}`, width/2, height/2);
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

  }
  catch(error) {
    console.log("something went wrong " + error);
  }
} 

function createButtons() {
  let index = 0;
  for (let [key, value] of stocks) {
    if (mouseIsInButton(buttons[index])) {
      fill(100);
    }
    else {
      fill(255);
    }

    rect(buttons[index].x, buttons[index].y, buttons[index].w, buttons[index].h);
    fill(0);
    if (key !== 'NOIS') {
      text(`${value.name}\n${value.price}`, buttons[index].x, buttons[index].y);
    }
    else {
      if (value.price.length === undefined) {
        text(`${value.name}\nPrice Loading...`, buttons[index].x, buttons[index].y);
      }
      else {
        text(`${value.name}\n${value.price[value.price.length - 1]}`, buttons[index].x, buttons[index].y);
      }
    }

    buttons[index].i = key;
    index ++;
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
  rect(width/2, height/2, w, w);
  
  // Ends function if stocks is currently being called/updated from backend
  let noise = stocks.get('NOIS');
  if (!noise.price || noise.price.length === undefined) {
    return; 
  }

  // Turns all strings (from toFixed) back into numbers in price array
  let prices = noise.price.map(p => parseFloat(p));

  // Built in function returns the max/min of prices array
  let minP = min(prices);
  let maxP = max(prices);

  // Sets up variables needed to create the graph
  let range = maxP - minP;
  let padding = w * 0.1;
  let graphLeft = width/2 - w/2 + padding;
  let graphRight = width/2 + w/2 - padding;
  let graphTop = height/2 - w/2 + padding;
  let graphBottom = height/2 + w/2 - padding;
  let graphWidth = graphRight - graphLeft;
  let graphHeight = graphBottom - graphTop;

  // Sets up x and y axis for graph
  line(graphLeft, graphBottom, graphRight, graphBottom); // x axis
  line(graphLeft, graphTop, graphLeft, graphBottom); // y axis

  // Creates labels for min/max on y axis
  textSize(w*0.05);
  textAlign(RIGHT, CENTER);
  text(maxP, graphLeft + padding - 5, graphTop + padding);
  text(minP, graphLeft + padding - 5, graphBottom - padding);
  textAlign(CENTER, CENTER);

  // Creates a single shape consiting all 200 points with lines connecting them
  beginShape();
  for (let i = 0; i < prices.length; i++) {
    let x = map(i, 0, prices.length - 1, graphLeft, graphRight);
    let y = map(prices[i], minP, maxP, graphBottom - pad, graphTop + pad);
    vertex(x, y);
  }
  endShape();

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