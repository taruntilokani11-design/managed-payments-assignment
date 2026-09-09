const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { subscriptions: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Domain record for a customer's subscription, keyed by Checkout Session id
// so the webhook handler can attach the resulting customer_id/subscription_id.
function saveSubscriptionRecord(checkoutSessionId, record) {
  const db = readDb();
  db.subscriptions[checkoutSessionId] = { ...db.subscriptions[checkoutSessionId], ...record };
  writeDb(db);
  return db.subscriptions[checkoutSessionId];
}

function getSubscriptionRecord(checkoutSessionId) {
  return readDb().subscriptions[checkoutSessionId] || null;
}

module.exports = {
  saveSubscriptionRecord,
  getSubscriptionRecord,
};
