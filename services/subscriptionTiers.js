const stripe = require('../lib/stripeClient');

// Both subscription tiers, set up in the Stripe Dashboard product catalog.
const PRO_PRODUCT_ID = 'prod_VEJDK3KXff2FTO'; // Llama Inc Pro — $9.99/mo
const ULTRA_PRODUCT_ID = 'prod_VEL8jQkf80Ix7Q'; // Llama Inc Ultra — $12.99/mo

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

// New subscribers start on the Pro tier; Ultra is offered as an upgrade
// through the Customer Portal after checkout.
function getDefaultTier() {
  return getTier(PRO_PRODUCT_ID);
}

module.exports = { PRO_PRODUCT_ID, ULTRA_PRODUCT_ID, getTier, getDefaultTier };
