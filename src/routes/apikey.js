import express from 'express';
import { UserCompany, Openapi, User, Logs } from '../models/index.js';
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

        let existing = await Openapi.findOne({ where: { userID, type: 'user' } });

        if (existing) {
            return res.json({ "type": "result", "result": "ok", "apikey": existing.value });
        }

        const value = generateApiKey();

        const newKey = await Openapi.create({
            userID,
            companyID: null,
            value,
            type: 'user'
        });

        res.status(201).json({ "type": "result", "result": "ok", "apikey": newKey.value });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted (user key generated) " + req.url + " from ip:" + req.ip,
            level: 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to generate API key" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access denied " + req.url + " from ip:" + req.ip + " error: " + error.message,
            level: 2
        });
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
    var [result, decoded] = await secTest(token);
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
        let existing = await Openapi.findOne({ where: { companyID, type: 'company' } });
        if (existing) {
            return res.json({ "type": "result", "result": "ok", "apikey": existing.value });
        }
        const value = generateApiKey();
        const newKey = await Openapi.create({
            userID,
            companyID,
            value,
            type: 'company'
        });
        res.status(201).json({ "type": "result", "result": "ok", "apikey": newKey.value });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted (company key generated) " + req.url + " from ip:" + req.ip,
            level: 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to generate API key" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access denied " + req.url + " from ip:" + req.ip + " error: " + error.message,
            level: 2
        });
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
        const existing = await Openapi.findOne({ where: { userID, type: 'user' } });

        return res.json({ "type": "result", "result": "ok", "apikey": existing ? existing.value : "" });
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
    try {
        const userID = decoded.id;
        const userCompanies = await UserCompany.findAll({
            where: { userID },
            include: [{ model: UserCompany.sequelize.models.Company, attributes: ['id', 'name'] }]
        });

        if (!userCompanies || userCompanies.length === 0) {
            return res.status(404).json({ "message": 'No companies associated with user' });
        }

        const companiesWithKeys = (
            await Promise.all(userCompanies.map(async (uc) => {
                const companyID = uc.companyID;
                const companyName = uc.Company ? uc.Company.name : null;
                const existing = await Openapi.findOne({ where: { companyID, type: 'company' } });
                if (existing) {
                    return {
                        companyID,
                        companyName,
                        apikey: existing.value
                    };
                }
                return null;
            }))
        ).filter(Boolean);

        return res.json({ "type": "result", "result": "ok", "companies": companiesWithKeys });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to retrieve API key" });
    }
});

/**
 * @route UPDATE /apikey/user/update
 * @desc Update API key for user
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message
 */
router.put('/user/update', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    try {
        const userID = decoded.id;

        const existing = await Openapi.findOne({ where: { userID, type: 'user' } });

        if (!existing) {
            return res.status(404).json({ "message": 'API key not found for user' });
        }

        const newValue = generateApiKey();
        existing.value = newValue;

        await existing.save();

        res.json({ "type": "result", "result": "ok", "message": "API key updated successfully", "apikey": newValue });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted (user key updated) " + req.url + " from ip:" + req.ip,
            level: 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to update API key" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access denied " + req.url + " from ip:" + req.ip + " error: " + error.message,
            level: 2
        });
    }
});

/**
 * @route UPDATE /apikey/company/update
 * @desc Update API key for company
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message
 */
router.put('/company/update', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    const { companyID } = req.body;

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

        const existing = await Openapi.findOne({ where: { companyID, type: 'company' } });

        if (!existing) {
            return res.status(404).json({ "message": 'API key not found for company' });
        }

        const newValue = generateApiKey();
        existing.value = newValue;

        await existing.save();

        res.json({ "type": "result", "result": "ok", "message": "API key updated successfully", "apikey": newValue });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted (company key updated) " + req.url + " from ip:" + req.ip,
            level: 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to update API key" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access denied " + req.url + " from ip:" + req.ip + " error: " + error.message,
            level: 2
        });
    }
});

/**
 * @route DELETE /apikey/user/delete
 * @desc Delete API key for user
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message
 */
router.delete('/user/delete', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }
    try {
        const userID = decoded.id;

        const existing = await Openapi.findOne({ where: { userID, type: 'user' } });

        if (!existing) {
            return res.status(404).json({ "message": 'API key not found for user' });
        }

        await existing.destroy();

        res.json({ "type": "result", "result": "ok", "message": "API key deleted successfully" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted (user key deleted) " + req.url + " from ip:" + req.ip,
            level: 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to delete API key" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access denied " + req.url + " from ip:" + req.ip + " error: " + error.message,
            level: 2
        });
    }
});

/**
 * @route DELETE /apikey/company/delete
 * @desc Delete API key for company
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message
 */
router.delete('/company/delete', async (req, res) => {
    var token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(403).json({ "error": 'Unauthorized' });
    }

    const { companyID } = req.body;

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

        const existing = await Openapi.findOne({ where: { companyID, type: 'company' } });

        if (!existing) {
            return res.status(404).json({ "message": 'API key not found for company' });
        }

        await existing.destroy();

        res.json({ "type": "result", "result": "ok", "message": "API key deleted successfully" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted (company key deleted) " + req.url + " from ip:" + req.ip,
            level: 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to delete API key" });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access denied " + req.url + " from ip:" + req.ip + " error: " + error.message,
            level: 2
        });
    }
});


export default router;
