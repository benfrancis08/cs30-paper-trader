// Created by Claude.ai
// https://claude.ai/share/deb0d47e-b35b-4ba8-b770-6354e61f44fc


// database.js
// Handles all database setup and operations for Paper Trader
// Uses better-sqlite3 (synchronous API — no async/await needed)

const Database = require('better-sqlite3');
const path = require('path');

// Stores the .db file in the backend folder next to server.js
const db = new Database(path.join(__dirname, 'papertrader.db'));

// ─── Performance settings ────────────────────────────────────────────────────
// WAL (Write-Ahead Logging) makes reads and writes faster and safer
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');   // Enforces user_id FK relationships


// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  -- Users: one row for now, but user_id is on every other table so
  -- adding more users later only requires removing the single-user guard.
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    cash_balance  REAL    NOT NULL DEFAULT 10000.00   -- Starting cash
  );

  -- Holdings: how many shares of each stock the user currently owns.
  -- A row is added on first purchase and removed when quantity hits 0.
  CREATE TABLE IF NOT EXISTS holdings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    symbol    TEXT    NOT NULL,
    quantity  REAL    NOT NULL DEFAULT 0,
    UNIQUE(user_id, symbol)   -- One row per user/stock pair
  );

  -- Transactions: permanent record of every buy and sell.
  -- price_at_trade lets you calculate profit/loss later.
  CREATE TABLE IF NOT EXISTS transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    symbol          TEXT    NOT NULL,
    type            TEXT    NOT NULL CHECK(type IN ('buy', 'sell')),
    quantity        REAL    NOT NULL,
    price_at_trade  REAL    NOT NULL,
    total_value     REAL    NOT NULL,   -- quantity * price_at_trade, stored for convenience
    timestamp       INTEGER NOT NULL DEFAULT (unixepoch())
  );

  -- NOIS prices: rolling 200-point history, same cap as the in-memory array.
  -- Survives server restarts so the chart has data immediately on reboot.
  CREATE TABLE IF NOT EXISTS nois_prices (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    price     REAL    NOT NULL,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);


// ─── Seed default user ───────────────────────────────────────────────────────
// Creates the single default user on first run. INSERT OR IGNORE means
// re-running the server never resets the balance or causes a crash.
db.prepare(`
  INSERT OR IGNORE INTO users (id, username, cash_balance)
  VALUES (1, 'player', 10000.00)
`).run();


// ─── User queries ─────────────────────────────────────────────────────────────

// Returns the full user row: { id, username, cash_balance }
function getUser(userId = 1) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

// Updates the user's cash balance after a trade
function updateCashBalance(newBalance, userId = 1) {
  db.prepare('UPDATE users SET cash_balance = ? WHERE id = ?')
    .run(newBalance, userId);
}


// ─── Holdings queries ─────────────────────────────────────────────────────────

// Returns all holdings for a user: [{ id, user_id, symbol, quantity }, ...]
function getHoldings(userId = 1) {
  return db.prepare('SELECT * FROM holdings WHERE user_id = ?').all(userId);
}

// Returns a single holding for one stock, or undefined if not owned
function getHolding(symbol, userId = 1) {
  return db.prepare('SELECT * FROM holdings WHERE user_id = ? AND symbol = ?')
    .get(userId, symbol);
}

// Upserts a holding — inserts if new, updates quantity if already owned.
// Call with the new TOTAL quantity (not the delta).
function setHolding(symbol, quantity, userId = 1) {
  if (quantity <= 0) {
    // Clean up rows with zero quantity so holdings stays tidy
    db.prepare('DELETE FROM holdings WHERE user_id = ? AND symbol = ?')
      .run(userId, symbol);
  } else {
    db.prepare(`
      INSERT INTO holdings (user_id, symbol, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, symbol) DO UPDATE SET quantity = excluded.quantity
    `).run(userId, symbol, quantity);
  }
}


// ─── Transaction queries ──────────────────────────────────────────────────────

// Logs a buy or sell to the permanent transaction history
function addTransaction(symbol, type, quantity, priceAtTrade, userId = 1) {
  const totalValue = quantity * priceAtTrade;
  db.prepare(`
    INSERT INTO transactions (user_id, symbol, type, quantity, price_at_trade, total_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, symbol, type, quantity, priceAtTrade, totalValue);
}

// Returns all transactions for a user, newest first
function getTransactions(userId = 1) {
  return db.prepare(`
    SELECT * FROM transactions
    WHERE user_id = ?
    ORDER BY timestamp DESC
  `).all(userId);
}


// ─── NOIS price history queries ───────────────────────────────────────────────
// Mirrors the in-memory 200-point cap from server.js

// Appends a new price and trims any rows beyond 200 (keeps the most recent)
function appendNoisPrice(price) {
  db.prepare('INSERT INTO nois_prices (price) VALUES (?)').run(price);

  // Count rows and delete oldest ones if over the 200-point cap
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM nois_prices').get().cnt;
  if (count > 200) {
    db.prepare(`
      DELETE FROM nois_prices
      WHERE id IN (
        SELECT id FROM nois_prices
        ORDER BY id ASC
        LIMIT ?
      )
    `).run(count - 200);
  }
}

// Returns the stored price history as a plain array of numbers, oldest first
function getNoisPrices() {
  const rows = db.prepare('SELECT price FROM nois_prices ORDER BY id ASC').all();
  return rows.map(row => row.price);
}


// ─── Trade helper ─────────────────────────────────────────────────────────────
// Wraps a buy or sell in a single DB transaction so the balance, holding,
// and history all update together — or not at all if something goes wrong.

const executeTrade = db.transaction((symbol, type, quantity, currentPrice, userId = 1) => {
  const user = getUser(userId);
  const totalCost = quantity * currentPrice;

  if (type === 'buy') {
    if (user.cash_balance < totalCost) {
      throw new Error('Insufficient funds');
    }
    const existing = getHolding(symbol, userId);
    const newQuantity = (existing ? existing.quantity : 0) + quantity;
    setHolding(symbol, newQuantity, userId);
    updateCashBalance(user.cash_balance - totalCost, userId);
  }
  else if (type === 'sell') {
    const existing = getHolding(symbol, userId);
    if (!existing || existing.quantity < quantity) {
      throw new Error('Insufficient shares');
    }
    setHolding(symbol, existing.quantity - quantity, userId);
    updateCashBalance(user.cash_balance + totalCost, userId);
  }
  else {
    throw new Error('Invalid trade type — must be "buy" or "sell"');
  }

  addTransaction(symbol, type, quantity, currentPrice, userId);
});


// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  db,              // Raw DB instance (for any one-off queries in server.js)
  getUser,
  updateCashBalance,
  getHoldings,
  getHolding,
  setHolding,
  addTransaction,
  getTransactions,
  appendNoisPrice,
  getNoisPrices,
  executeTrade,    // Use this for all trades — keeps everything atomic
};
