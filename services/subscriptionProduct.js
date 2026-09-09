const stripe = require('../lib/stripeClient');

// Blueprint pins this exact preview version for Managed Payments requests —
// don't substitute a different one even though the feature has since gone stable.
const MANAGED_PAYMENTS_API_VERSION = '2026-02-25.preview';

// "Llama Inc Pro" — the subscription product set up in the Stripe Dashboard
// product catalog. Fetched fresh each time (rather than cached locally) so
// the price always matches whatever's currently configured in the Dashboard.
const SUBSCRIPTION_PRODUCT_ID = 'prod_VEJDK3KXff2FTO';

async function getSubscriptionProduct() {
  const product = await stripe.products.retrieve(SUBSCRIPTION_PRODUCT_ID);

  return {
    productId: product.id,
    priceId: product.default_price,
  };
}

module.exports = { getSubscriptionProduct, MANAGED_PAYMENTS_API_VERSION };
