import cron from 'node-cron';
import { Op } from 'sequelize';
import { Subscription, User } from '../models/index.js';

//Run the task every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running subscription expiration task...');
        const [expiredCount] = await Subscription.update(
            { status: 'expired' },
            {
                where: {
                    status: 'active',
                    expirationDate: { [Op.lt]: new Date() }
                }
            }
        );
        if (expiredCount > 0) {
            console.log(`Expired ${expiredCount} subscriptions.`);
        }

        const users = await User.findAll({ where: { isPremiumUser: true } });
        for (const user of users) {
            const activeCount = await Subscription.count({
                where: { userID: user.id, status: 'active' }
            });
            if (activeCount === 0) {
                user.isPremiumUser = false;
                await user.save();
                console.log(`Set isPremiumUser to false for user ${user.id}`);
            }
        }
    } catch (err) {
        console.error('Error expiring subscriptions or updating users:', err);
    }
});
