const express = require('express');
const stripe = require('../lib/stripeClient');
const store = require('../lib/store');

const router = express.Router();

// Mounted with express.raw() in server.js — signature verification needs the
// untouched request body, not the JSON-parsed one.
router.post('/webhook', (req, res) => {
  let event = JSON.parse(req.body);

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }
  } else {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (sandbox only).');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    store.saveSubscriptionRecord(session.id, {
      checkoutSessionId: session.id,
      status: 'active',
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
    console.log(`checkout.session.completed — customer ${session.customer}, subscription ${session.subscription}`);
  }

  res.json({ received: true });
});

module.exports = router;
