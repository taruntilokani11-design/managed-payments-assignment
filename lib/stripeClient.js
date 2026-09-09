require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY. Copy .env.example to .env and fill in your sandbox key.');
}

// No apiVersion pinned here — individual calls that require the Managed
// Payments preview version pass it per-request via requestOptions instead.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
