import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const terminalQty = parseInt(req.query.terminal_qty || '0', 10) || 0;
    const childQty = parseInt(req.query.child_qty || '0', 10) || 0;

    if (terminalQty === 0 && childQty === 0) {
      return res.status(400).send('Nothing selected');
    }

    const line_items = [];

    if (terminalQty > 0) {
      line_items.push({
        price: 'price_1TMTneBFNppMraU7kORHl8to',
        quantity: terminalQty,
      });
    }

    if (childQty > 0) {
      line_items.push({
        price: 'price_1SYCJ7BFNppMraU7YzrheMZz',
        quantity: childQty,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: childQty > 0 ? 'subscription' : 'payment',
      line_items,
      success_url: 'https://kido.nyc/',
      cancel_url: 'https://kido.nyc/',
    });

    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).send(err.message || 'Server error');
  }
}
