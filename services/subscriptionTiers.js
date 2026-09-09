const stripe = require('../lib/stripeClient');

// Both subscription tiers, set up in the Stripe Dashboard product catalog.
const PRO_PRODUCT_ID = 'prod_VEJDK3KXff2FTO'; // Llama Inc Pro — $9.99/mo
const ULTRA_PRODUCT_ID = 'prod_VEL8jQkf80Ix7Q'; // Llama Inc Ultra — $12.99/mo

const TIER_PRODUCT_IDS = [PRO_PRODUCT_ID, ULTRA_PRODUCT_ID];

// Fetched fresh from Stripe each time (not cached locally) so the price
// always matches whatever's currently configured in the Dashboard, and
// restarting the app never creates duplicate products.
async function getTier(productId) {
  const product = await stripe.products.retrieve(productId);
  return {
    productId: product.id,
    priceId: product.default_price,
    name: product.name,
  };
}

// Validates a customer-supplied product id against the known tiers before
// trusting it — a submitted form field shouldn't be able to check out
// against an arbitrary Stripe product.
function getSelectedTier(productId) {
  if (!TIER_PRODUCT_IDS.includes(productId)) {
    return getTier(PRO_PRODUCT_ID);
  }
  return getTier(productId);
}

module.exports = { PRO_PRODUCT_ID, ULTRA_PRODUCT_ID, TIER_PRODUCT_IDS, getTier, getSelectedTier };
