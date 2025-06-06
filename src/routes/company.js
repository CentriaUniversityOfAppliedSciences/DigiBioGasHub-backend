import express from 'express';
import { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics } from '../models/index.js';
import jwt from 'jsonwebtoken';
import { getCoords, secTest } from '../functions/utils.js'; 


const router = express.Router();

/**
 * @route POST /getterminals
 * @desc Get all logistics terminals
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {array} terminals
 */
router.post('/getterminals', async (req, res) => {
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);

    if (!result) {
        return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

  try {
    const terminals = await Logistics.findAll({
      where:{
        companyID: req.body.companyID,
      }
    });
    res.json({ type: "result", result: "ok", message: terminals });
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to get terminals" });
  }
});

/**
 * @route POST /company/deleteterminal
 * @desc Delete a logistics terminal
 * @param {uuid} terminalID
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message 
 */
router.post('/deleteterminal', async (req, res) => {
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);

    if (!result) {
        return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

  try {
    const terminal = await Logistics.destroy({
      where: {
        id: req.body.terminalID,
        companyID: req.body.companyID,
      }
    });

    if (terminal) {
      res.json({ type: "result", result: "ok", message: "Terminal deleted successfully" });
    } else {
      res.json({ type: "result", result: "fail", message: "Terminal not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to delete terminal" });
  }
});


export default router;