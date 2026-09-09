require('dotenv').config();
const express = require('express');
const path = require('path');
const checkoutRoutes = require('./routes/checkout');
const webhookRoutes = require('./routes/webhook');
const portalRoutes = require('./routes/portal');

const app = express();

// Webhook route needs the raw body for signature verification, so it's
// registered before express.json() touches the request.
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(checkoutRoutes);
app.use(portalRoutes);

app.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message });
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
