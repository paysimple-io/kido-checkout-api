// api/kido-checkout.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Allow Webflow to call this endpoint
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
    // Vercel usually gives us a parsed body already
    let data = req.body || {};

    // If for some reason it's a string, parse it
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error('JSON parse error:', e, data);
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
      }
    }

    const terminals = parseInt(data.terminals, 10) || 0;
    const children  = parseInt(data.children, 10) || 0;

    if (terminals < 1 || children < 1) {
      res.status(400).json({ error: 'Invalid quantities' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // subscription + one-time together
      line_items: [
        {
          // one-time terminal fee
          price: 'price_1SXpG1ECEjbjI89GPPV7Nrm2',
          quantity: terminals,
        },
        {
          // $3 per child / month
          price: 'price_1SXpGFECEjbjI89GVl70QwO1',
          quantity: children,
        },
      ],
      success_url: 'https://kido.nyc/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://kido.nyc/cancel',
    });

    console.log('Created session', session.id);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Stripe error', message: err.message });
  }
};