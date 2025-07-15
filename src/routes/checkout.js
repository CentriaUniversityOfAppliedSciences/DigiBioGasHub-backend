import express from 'express';
import Stripe from 'stripe';
import 'dotenv/config'
import { secTest } from '../functions/utils.js';

const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const priceMap = {
    '3': process.env.THREE_MONTHS_SUBSCRIPTION_PRICE,
    '6': process.env.SIX_MONTHS_SUBSCRIPTION_PRICE,
    '12': process.env.TWELVE_MONTHS_SUBSCRIPTION_PRICE
};

router.post('/create-checkout-session', async (req, res) => {

    const token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);


    if (!result) {
        return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

    const { months } = req.body;
    const priceId = priceMap[months];

    if (!priceId) return res.status(400).json({ error: 'Invalid plan selected' });

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.FRONTEND_URL}/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/paymentcancel`,
            metadata: {
                userID: decoded.id,
                months: months
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Error:', error.message);
        res.status(500).json({ error: 'Stripe checkout failed' });
    }
});

export default router;
