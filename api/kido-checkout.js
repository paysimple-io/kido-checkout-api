// api/kido-checkout.js
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // we'll set this in Vercel

module.exports = async (req, res) => {
  // Basic CORS so Webflow can call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { terminals, children } = req.body || {};

    const terminalQty = parseInt(terminals, 10) || 0;
    const childQty    = parseInt(children, 10) || 0;

    if (terminalQty < 1 || childQty < 1) {
      res.status(400).json({ error: 'Invalid quantities' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // recurring + one-time in same checkout
      line_items: [
        {
          // One-time terminal payment
          price: 'price_1SXmbvEJWX9SSf0aotDEsU9s', // TERMINAL PRICE
          quantity: terminalQty,
        },
        {
          // $3 per child per month
          price: 'price_1SXmcUEJWX9SSf0aTejdPeFu', // TAG / CHILD PRICE
          quantity: childQty,
        },
      ],
      success_url: 'https://kido.nyc/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://kido.nyc/cancel',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(400).json({ error: 'Unable to create checkout session' });
  }
};
