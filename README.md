# Managed Payments subscription sandbox

A minimal subscription integration using **Stripe Checkout with Managed Payments**
(Stripe acts as merchant of record — handles tax, fraud, disputes for you).

Sandbox account: **Llama Inc sandbox** (`acct_1UChvKBohAYF95kp`, test mode).

## What it does

1. `GET /` — a page with a "Subscribe" button.
2. `POST /create-checkout-session` — creates the "Basic subscription" product
   ($10/month) the first time it's called (persisted after that), then creates
   a Stripe Checkout Session with Managed Payments enabled and redirects the
   customer to Stripe's hosted checkout page.
3. `GET /success` / `GET /cancel` — pages Stripe redirects back to.
4. `POST /webhook` — listens for `checkout.session.completed` and saves the
   resulting `customer_id` / `subscription_id` into `data/db.json`, keyed by
   Checkout Session id.

## One-time setup in the Stripe Dashboard (required — I can't do this part)

Managed Payments has to be turned on and its Terms of Service accepted by a
human, in test mode:

1. Go to https://dashboard.stripe.com/test/settings/managed-payments
2. Enable Managed Payments and accept the Terms of Service.

If you skip this, `create-checkout-session` will fail with an error from
Stripe about Managed Payments not being enabled on the account.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — from
  https://dashboard.stripe.com/test/apikeys (make sure you're in **test mode**,
  toggle top-right of the Dashboard).
- `STRIPE_WEBHOOK_SECRET` — optional, only needed if you want to test the
  webhook locally (see below). If left blank, the webhook route still works
  but skips signature verification — fine for this sandbox, not for production.

## Run it

```bash
npm run dev
```

Open http://localhost:4242 and click **Subscribe**. On the Stripe checkout
page, try different billing addresses to see tax calculated differently, then
pay with the test card `4242 4242 4242 4242`, any future expiry date, any CVC.

## Testing the webhook (optional)

Install the Stripe CLI (`brew install stripe/stripe-cli/stripe`) and run:

```bash
stripe listen --forward-to localhost:4242/webhook
```

Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in `.env`
and restart the server. Completing a checkout will now log the customer and
subscription IDs to the terminal and save them to `data/db.json`.

If you'd rather not install the CLI, you can still verify the flow worked by
checking https://dashboard.stripe.com/test/payments after a test payment, or
via **Developers → Events** in the Dashboard.

## Where things are persisted

`data/db.json` (gitignored) — a tiny JSON file standing in for a real
datastore:
- `product` — the Stripe `product_id` / `price_id` created once and reused.
- `subscriptions` — one record per Checkout Session, filled in by the webhook
  with `customerId` / `subscriptionId` once payment completes.
