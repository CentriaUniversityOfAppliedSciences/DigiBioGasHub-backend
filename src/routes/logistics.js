import express from 'express';
import { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics } from '../models/index.js';
import jwt from 'jsonwebtoken';
import { getCoords, secTest } from '../functions/utils.js'; 

const router = express.Router();


/**
 * @route POST /getterminals
 * @desc Get all logistics terminals with visibility set to public
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {array} terminals
 */
router.post('/getterminals', async (req, res) => {
  const token = req.headers['authorization'];
  var [result, decoded] = await secTest(token);

  if (!result) {
    return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {

    const settings = await Settings.findOne({
      where: {
        userID: decoded.id,
        key: "map"
      }
    });

    const filterSettings = settings && typeof settings.value === 'string' ? JSON.parse(settings.value): settings?.value || {};
  
    const shouldFilter = Object.values(filterSettings).some(value => value === true);

    let terminals = [];

    if (!shouldFilter || filterSettings.terminals) {
      terminals = await Logistics.findAll({
        where: {
          visibility: 1 // Only public terminals
        }
      });
    }
    res.json({ type: "result", result: "ok", message: terminals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: "result", result: "fail", message: "Unable to get terminals" });
  }
});


/*
* @route POST /logistics/register
* @param {uuid} companyID
* @param {string} address
* @param {string} city
* @param {string} zipcode
* @param {string} haulTyp
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} logistics entry
*/

router.post('/register', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const {
      companyID,
      companyName,
      address,
      city,
      zipcode,
      haulType,
      visibility,
    } = req.body;

    const company = await Company.findOne({
      where: {
        id: companyID,
        name: companyName
      }
    });

    if (!company) {
      return res.status(400).json({ "type": "result", "result": "fail", "message": "Invalid company ID or name" });
    }

    const userCompany = await UserCompany.findOne({
      where: {
        userID: decoded.id,
        companyID: companyID
      }
    });

    if (!userCompany) {
      return res.status(403).json({ "type": "result", "result": "fail", "message": "Unauthorized user" });
    }

    const geoRes = await getCoords(address, zipcode, city );

    const { lat, lng } = geoRes.data;

    const logistics = await Logistics.create({
      companyID,
      companyName,
      address,
      city,
      zipcode,
      latitude: lat,
      longitude: lng,
      haulType,
      visibility,
    });

    res.json({ "type": "result", "result": "ok", "message": logistics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to register logistics entry" });
  }
});

export default router;