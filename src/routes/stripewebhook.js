import express from 'express';
import Stripe from 'stripe';
import 'dotenv/config'
import { User, Logs, Subscription } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!process.env.USE_PAYMENT || process.env.USE_PAYMENT !== 'true') {
        return res.status(503).json({ error: 'Payment service is currently unavailable' });
    }

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Invalid signature', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true });               
  }

  try {
    const session = event.data.object;
    const userID = session.metadata.userID;
    const monthsBought = Number(session?.metadata?.months ?? 0);
    //console.log("session", session)

    if (!userID || !monthsBought) {
      console.warn('Missing metadata on session', session.id);
      return res.json({ received: true });
    }

    const now = new Date();

    const latestSub = await Subscription.findOne({
      where  : { userID, status: 'active' },
      order  : [['expirationDate', 'DESC']]
    });

    const subscriptionDate =
      latestSub && new Date(latestSub.expirationDate) > now
        ? new Date(latestSub.expirationDate)
        : now;

    const expirationDate = new Date(subscriptionDate); 
    expirationDate.setMonth(expirationDate.getMonth() + monthsBought);

    const subscription = await Subscription.create({
      userID,
      subscriptionDate,
      expirationDate,
      status: 'active',
    //  stripeSubscriptionId: session.subscription  
    });

    await User.update({ userlevel: 2, isPremiumUser: true }, { where: { id: userID } });

    Logs.create({
      userID,
      action: '/webhook',
      text  : `Stripe purchase stacked (${monthsBought}m). Exp to ${expirationDate.toISOString()}`,
      level : 1
    });

    res.json({ received: true });

  } catch (err) {
    console.error('DB error in webhook:', err);
    Logs.create({ userID: null, action: '/webhook', text: err.message, level: 3 });
    res.status(200).end();   
  }
});

export default router;
