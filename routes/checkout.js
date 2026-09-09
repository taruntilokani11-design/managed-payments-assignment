const express = require('express');
const stripe = require('../lib/stripeClient');
const store = require('../lib/store');
const { ensureSubscriptionProduct, MANAGED_PAYMENTS_API_VERSION } = require('../services/subscriptionProduct');

const router = express.Router();

router.post('/create-checkout-session', async (req, res, next) => {
  try {
    const product = await ensureSubscriptionProduct();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{ price: product.priceId, quantity: 1 }],
        managed_payments: { enabled: true },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/cancel`,
      },
      { apiVersion: MANAGED_PAYMENTS_API_VERSION }
    );

    // Seed the domain record now so the webhook handler has something to update
    // with the customer_id/subscription_id once checkout.session.completed arrives.
    store.saveSubscriptionRecord(session.id, {
      checkoutSessionId: session.id,
      status: 'pending',
    });

    res.redirect(303, session.url);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
