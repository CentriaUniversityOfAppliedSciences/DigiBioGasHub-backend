import express from 'express';
import { User, Logs, Subscription } from '../models/index.js';
import { secTest } from '../functions/utils.js';

const router = express.Router();

/*
* @route GET /subscription/me
* @desc Get subscription details
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} subscription details
*/

router.get('/me', async (req, res) => {
    if (!process.env.USE_PAYMENT || process.env.USE_PAYMENT !== 'true') {
        return res.status(503).json({ error: 'Payment service is currently unavailable' });
    }
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }
    try {
        const subscription = await Subscription.findAll({
            where: { userID: decoded.id, status: 'active' }
        });

        if (!subscription || subscription.length === 0) {
            return res.json({ "message": 'No active subscription found' });
        }

        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted " + req.url + " from ip:" + req.ip,
            level: 1
        });
        return res.json({ "type": "result", "result": "ok", "message": subscription });
    } catch (error) {
        console.error(error);
        Logs.create({
            userID: null,
            action: req.url,
            text: "access not granted " + req.url + " from ip:" + req.ip,
            level: 2
        });
        return res.status(500).json({ "error": 'Internal server error' });
    }
});

/*
* @route POST /subscription/cancel
* @desc Cancel subscription
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {string} success message
*/
router.post('/cancel', async (req, res) => {
    if (!process.env.USE_PAYMENT || process.env.USE_PAYMENT !== 'true') {
        return res.status(503).json({ error: 'Payment service is currently unavailable' });
    }
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }
    try {
        
        const { subscriptionID } = req.body;

        const subscription = await Subscription.findOne({
            where: { id: subscriptionID ,userID: decoded.id, status: 'active' }
        });

        if (!subscription) {
            return res.status(404).json({ "error": 'Subscription not found' });
        }

        subscription.status = 'canceled';
        await subscription.save();

        const activeSubscriptions = await Subscription.count({
            where: { userID: decoded.id, status: 'active' }
        });
        
        if (activeSubscriptions === 0) {
            const user = await User.findOne({ where: { id: decoded.id }});
            user.isPremiumUser = false;
            await user.save();
        }

        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted " + req.url + " from ip:" + req.ip,
            level: 1
        });
        return res.json({ "type": "result", "result": "ok", "message": 'Subscription canceled successfully' });
    } catch (error) {
        console.error(error);
        Logs.create({
            userID: null,
            action: req.url,
            text: "access not granted " + req.url + " from ip:" + req.ip,
            level: 2
        });
        return res.status(500).json({ "error": 'Internal server error' });
    }
});


export default router;
