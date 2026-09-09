const stripe = require('../lib/stripeClient');
const { PRO_PRODUCT_ID, ULTRA_PRODUCT_ID, getTier } = require('./subscriptionTiers');

// Tags the configuration this app owns so it can find and reuse it later,
// instead of relying on Stripe's notion of "default" (which the API can't
// set on creation — only the Dashboard's "Activate" button can).
const METADATA_TAG = 'llama-managed-payments-assignment';

// Cheap in-memory cache for this process's lifetime. Safe to lose on
// restart — ensurePortalConfiguration() always checks Stripe itself before
// creating a new one, so a cold cache never produces a duplicate.
let cachedConfigurationId = null;

async function ensurePortalConfiguration() {
  if (cachedConfigurationId) {
    return cachedConfigurationId;
  }

  const existing = await stripe.billingPortal.configurations.list({ limit: 100 });
  const match = existing.data.find((config) => config.metadata?.app === METADATA_TAG);
  if (match) {
    cachedConfigurationId = match.id;
    return match.id;
  }

  const [pro, ultra] = await Promise.all([getTier(PRO_PRODUCT_ID), getTier(ULTRA_PRODUCT_ID)]);

  const configuration = await stripe.billingPortal.configurations.create({
    metadata: { app: METADATA_TAG },
    business_profile: {
      headline: 'Manage your Llama Inc subscription',
    },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: [
          { product: pro.productId, prices: [pro.priceId] },
          { product: ultra.productId, prices: [ultra.priceId] },
        ],
      },
    },
  });

  cachedConfigurationId = configuration.id;
  return configuration.id;
}

module.exports = { ensurePortalConfiguration };
