import express from 'express';
import { UserCompany, Openapi } from '../models/index.js';
import { generateApiKey } from '../functions/utils.js';


const router = express.Router();

/**
 * @route POST /apikey/generate
 * @desc Generate a new API key
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} generated API key
 */
router.post('/generate', async (req, res) => {
    const { userID, companyID } = req.body;

    if (!userID || !companyID) {
        return res.status(400).json({ error: 'Missing userID or companyID' });
    }

    try {
        
        const userCompany = await UserCompany.findOne({
            where: { userID, companyID }
        });

        if (!userCompany) {
            return res.status(403).json({ "error": 'Unauthorized user or invalid company' });
        }

        let existing = await Openapi.findOne({ where: { userID, companyID } });

        if (existing) {
            return res.json({ "type":"result", "result":"ok", "apikey": existing.value });
        }

        const value = generateApiKey();

        const newKey = await Openapi.create({
            userID,
            companyID,
            value,
        });

        return res.status(201).json({ "type":"result", "result":"ok","apikey": newKey.value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to generate API key" });
    }
}
);

export default router;
