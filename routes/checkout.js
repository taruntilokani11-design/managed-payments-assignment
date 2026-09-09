const express = require('express');
const stripe = require('../lib/stripeClient');
const store = require('../lib/store');
const { getSelectedTier } = require('../services/subscriptionTiers');

const router = express.Router();

// Blueprint pins this exact preview version for Managed Payments requests —
// don't substitute a different one even though the feature has since gone stable.
const MANAGED_PAYMENTS_API_VERSION = '2026-02-25.preview';

router.post('/create-checkout-session', async (req, res, next) => {
  try {
    const tier = await getSelectedTier(req.body.product);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{ price: tier.priceId, quantity: 1 }],
        managed_payments: { enabled: true },
        // {CHECKOUT_SESSION_ID} is a literal placeholder Stripe substitutes —
        // the success page uses it to look up the resulting customer for the
        // "Manage subscription" link.
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
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
