const stripe = require('../lib/stripeClient');
const store = require('../lib/store');

// Blueprint pins this exact preview version for Managed Payments requests —
// don't substitute a different one even though the feature has since gone stable.
const MANAGED_PAYMENTS_API_VERSION = '2026-02-25.preview';

// Creates the "Basic subscription" product (and its default recurring price)
// the first time this runs, then reuses the persisted IDs on every later call.
async function ensureSubscriptionProduct() {
  const existing = store.getProduct();
  if (existing) {
    return existing;
  }

  const product = await stripe.products.create(
    {
      name: 'Basic subscription',
      description: 'A basic subscription to our service',
      tax_code: 'txcd_10103100',
      default_price_data: {
        unit_amount: 1000,
        currency: 'usd',
        recurring: { interval: 'month' },
      },
    },
    { apiVersion: MANAGED_PAYMENTS_API_VERSION }
  );

  return store.saveProduct({
    productId: product.id,
    priceId: product.default_price,
  });
}

module.exports = { ensureSubscriptionProduct, MANAGED_PAYMENTS_API_VERSION };
