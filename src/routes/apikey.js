import express from 'express';
import { UserCompany, Openapi, User } from '../models/index.js';
import { secTest, generateApiKey } from '../functions/utils.js';

const router = express.Router();

/**
 * @route POST /apikey/user/generate
 * @desc Generate a new API key for user
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} generated API key
 */
router.post('/user/generate', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    try {
        const userID = decoded.id;
        const user = await User.findOne({ where: { id: userID } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let existing = await Openapi.findOne({ where: { userID, type:'user' } });

        if (existing) {
            return res.json({ "type":"result", "result":"ok", "apikey": existing.value });
        }

        const value = generateApiKey();

        const newKey = await Openapi.create({
            userID,
            companyID:null,
            value,
            type:'user'
        });

        return res.status(201).json({ "type":"result", "result":"ok","apikey": newKey.value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to generate API key" });
    }
});


/**
 * @route POST /apikey/company/generate
 * @desc Generate a new API key for a company
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} generated API key
 */
router.post('/company/generate', async (req, res) => {

    var token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    const { companyID } = req.body;
    if (!companyID) {
        return res.status(400).json({ error: 'Missing userID or companyID' });
    }
    try {
        const userID = decoded.id;
        const userCompany = await UserCompany.findOne({
            where: { userID, companyID }
        });
        if (!userCompany) {
            return res.status(403).json({ "error": 'Unauthorized user or invalid company' });
        }
        let existing = await Openapi.findOne({ where: { companyID, type:'company' } });
        if (existing) {
            return res.json({ "type":"result", "result":"ok", "apikey": existing.value });
        }
        const value = generateApiKey();
        const newKey = await Openapi.create({
            userID,
            companyID,
            value,
            type:'company'
        });
        return res.status(201).json({ "type":"result", "result":"ok","apikey": newKey.value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to generate API key" });
    }
});

/**
 * get api key for user
 * @route GET /apikey/user
 * @desc Get API key for user
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} API key
 */
router.get('/user', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    try {
        const userID = decoded.id;
        const existing = await Openapi.findOne({ where: { userID, type:'user' } });

        if (!existing) {
            return res.status(404).json({ "message": 'API key not found for user' });
        }

        return res.json({ "type":"result", "result":"ok", "apikey": existing.value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to retrieve API key" });
    }
});

/**
 * get api key for company
 * @route GET /apikey/company
 * @desc Get API key for company
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} API key
 */
router.get('/company', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    const { companyID } = req.query;

    if (!companyID) {
        return res.status(400).json({ error: 'Missing companyID' });
    }
    try {
        const userID = decoded.id;

        const userCompany = await UserCompany.findOne({
            where: { userID, companyID }
        });

        if (!userCompany) {
            return res.status(403).json({ "error": 'Unauthorized user or invalid company' });
        }

        const existing = await Openapi.findOne({ where: { companyID, type:'company' } });

        if (!existing) {
            return res.status(404).json({ "message": 'API key not found for company' });
        }

        return res.json({ "type":"result", "result":"ok", "apikey": existing.value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to retrieve API key" });
    }
});


export default router;
