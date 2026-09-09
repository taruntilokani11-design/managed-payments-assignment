const express = require('express');
const stripe = require('../lib/stripeClient');
const store = require('../lib/store');
const { ensurePortalConfiguration } = require('../services/billingPortal');

const router = express.Router();

const PAGE_STYLES = `
  :root {
    --ink: #1b1530; --muted: #6b6180; --bg: #faf8fc; --card: #ffffff;
    --accent: #6d4bff; --accent-dark: #5836e0; --border: #ece7f7;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--ink); padding: 1.5rem;
  }
  .card {
    background: var(--card); border: 1px solid var(--border); border-radius: 20px;
    box-shadow: 0 20px 40px -24px rgba(27, 21, 48, 0.25); padding: 2.75rem 2.5rem;
    max-width: 26rem; width: 100%; text-align: center;
  }
  .badge { font-size: 2.5rem; margin-bottom: 0.75rem; }
  h1 { font-size: 1.4rem; margin: 0 0 0.6rem; }
  p { color: var(--muted); margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.5; }
  button {
    width: 100%; font-size: 1rem; font-weight: 600; padding: 0.9rem 1.5rem; border: none;
    border-radius: 12px; background: var(--accent); color: white; cursor: pointer;
  }
  button:hover { background: var(--accent-dark); }
`;

function renderSuccessPage({ tierName, customerId }) {
  const manageSection = customerId
    ? `
      <form action="/create-portal-session" method="POST">
        <input type="hidden" name="customer" value="${customerId}" />
        <button type="submit">Manage subscription</button>
      </form>
    `
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Llama — Subscribed!</title>
    <style>${PAGE_STYLES}</style>
  </head>
  <body>
    <div class="card">
      <div class="badge">🎉</div>
      <h1>Thanks for subscribing${tierName ? ` to ${tierName}` : ''}!</h1>
      <p>You can upgrade, downgrade, or cancel anytime from your subscription settings.</p>
      ${manageSection}
    </div>
  </body>
</html>`;
}

router.get('/success', async (req, res, next) => {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) {
      return res.send(renderSuccessPage({}));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    const tierName = session.line_items?.data?.[0]?.price?.product?.name;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    store.saveSubscriptionRecord(session.id, {
      checkoutSessionId: session.id,
      status: 'active',
      customerId,
      subscriptionId: session.subscription,
    });

    res.send(renderSuccessPage({ tierName, customerId }));
  } catch (err) {
    next(err);
  }
});

router.post('/create-portal-session', async (req, res, next) => {
  try {
    const { customer } = req.body;
    if (!customer) {
      return res.status(400).json({ error: 'Missing customer id' });
    }

    const configuration = await ensurePortalConfiguration();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer,
      configuration,
      return_url: baseUrl,
    });

    res.redirect(303, portalSession.url);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
