# CS30 Capstone Project - Paper Trader
A paper trader that utilizes a frontend and backend, talking to each other through a tailscale funnel, that pulls real stock data and lets you make trades on the frontend made through p5.js which will send information to the backend hosted on a home server.

## Must Haves:
- A home server using node and express.js accessible globally - through a tailscale funnel
- Database - to save data if server gets turned off
- Data fetching - at least one real stock price/information
- Sandbox mode - at least one fake stock that is updated on a small interval
- Realistic trading logic - can't buy more than you can afford, can't sell more than you have, etc
- p5.js frontend - interactive visual that communicates with backend through tailscale funnels

## Nice to Haves:
- Visual charts/graphs of past stock data
- Past transaction history
- Live updating stocks (on a preset interval)
- Users
