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


/**
 * @route POST /company/removeuser
 * @desc Remove a user from a company
 * @param {uuid} userID
 * @param {uuid} companyID
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message 
 */ 

router.post('/removeuser', async (req, res) => {
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);

    if (!result) {
        return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

  try {
    const userCompany = await UserCompany.destroy({
      where: {
        userID: req.body.userID,
        companyID: req.body.companyID,
      }
    });

    if (userCompany) {
      res.json({ type: "result", result: "ok", message: "User removed successfully" });
    } else {
      res.json({ type: "result", result: "fail", message: "User not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to remove user" });
  }
}
);  

/*
* @route POST /company/getusers
* @param {uuid} companyID
* @where user.id = jwt_token.id
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} users
*/

router.post("/getusers", async (req, res) => {

  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try{
    if (result == true){
      var body = req.body;
      const users = await UserCompany.findAll({
        where: { companyID: body.id },
        include: [
          {
            model: User,
            attributes: { exclude: ['password'] }
          }
        ]
      });
      res.json({ "type": "result", "result": "ok", "message": users });
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get company users"});
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
});


/* 
* @route POST /company/edituser
* @param {uuid} userID
* @param {integer} userlevel
* @param {uuid} companyID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {string} success message
*/

router.post("/edituser", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const { userID, userlevel, companyID } = req.body;
    const userCompany = await UserCompany.findOne({
      where: { userID, companyID }
    });
    if (!userCompany) {
      return res.json({ "type": "result", "result": "fail", "message": "User not found in company" });
    }
    userCompany.userlevel = userlevel;
    await userCompany.save();
    res.json({ "type": "result", "result": "ok", "message": "User updated successfully" });
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access granted " + req.url + " from ip:" + req.ip,
      level: 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "Error updating user" });
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
});

/*
* @route POST /company/getusercompanydata
* @param {uuid} companyID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} company data
*/
router.post("/getusercompanydata", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const { companyID } = req.body;
    const userCompany = await UserCompany.findOne({
      where: { userID: decoded.id, companyID },
    });

    if (!userCompany) {
      return res.json({ "type": "result", "result": "fail", "message": "User not found in company" });
    }

    res.json({ "type": "result", "result": "ok", "message": userCompany });
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access granted " + req.url + " from ip:" + req.ip,
      level: 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "Error fetching company data" });
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
});

/*
* @route POST /company/addlocation
* @param {uuid} companyID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {array} locations
*/
router.post('/addlocation', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const { companyID, companyName, address, city, zipcode } = req.body;

    const coords = await getCoords(address, city, zipcode);
    if (!coords) {
      return res.json({ type: "result", result: "fail", message: "Invalid address or unable to retrieve coordinates" });
    }

    const location = await Location.create({
      companyID,
      name: companyName,
      address,
      city,
      zipcode,
      type: 4,
      latitude: coords.data.lat,
      longitude: coords.data.lng
    });

    res.json({ type: "result", result: "ok", message: location });
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access granted " + req.url + " from ip:" + req.ip,
      level: 1
    });
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to add location" });
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
});

/*
* @route POST /company/getAllLocations
* @desc Get all locations for a company
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {array} locations
*/
router.post('/getAllLocations', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const locations = await Location.findAll({
      where: {
        type: 4 
      }
    });

    res.json({ type: "result", result: "ok", message: locations });
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access granted " + req.url + " from ip:" + req.ip,
      level: 1
    });
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to get locations" });
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
}
);

/*
 * @route POST /company/getlocations
 * @param {uuid} companyID
 * @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {array} locations
 */
router.post('/getlocations/by-company', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const locations = await Location.findAll({
      where: {
        companyID: req.body.companyID,
        type: 4 
      }
    });

    res.json({ type: "result", result: "ok", message: locations });
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access granted " + req.url + " from ip:" + req.ip,
      level: 1
    });
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to get locations" });
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
});

/*
 * @route POST /company/updatelocation
 * @param {integer} locationID
 * @param {string} address
 * @param {string} city
 * @param {string} zipcode
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message 
 */
router.post('/updatelocation', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const { locationID, address, city, zipcode } = req.body;

    const coords = await getCoords(address, city, zipcode);
    if (!coords) {
      return res.json({ type: "result", result: "fail", message: "Invalid address or unable to retrieve coordinates" });
    }

    const location = await Location.update({
      address,
      city,
      zipcode,
      latitude: coords.data.lat,
      longitude: coords.data.lng
    }, {
      where: {
        id: locationID,
        companyID: req.body.companyID,
        type: 4 
      }
    });

    if (location[0] > 0) {
      res.json({ type: "result", result: "ok", message: "Location updated successfully" });
    } else {
      res.json({ type: "result", result: "fail", message: "Location not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to update location" });
  }
}
);

/*
 * @route POST /company/deletelocation
 * @desc Delete a location
 * @param {integer} locationID
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message 
 */
router.post('/deletelocation', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  if (!result) {
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const location = await Location.destroy({
      where: {
        id: req.body.locationID,
        companyID: req.body.companyID,
      }
    });

    if (location) {
      res.json({ type: "result", result: "ok", message: "Location deleted successfully" });
    } else {
      res.json({ type: "result", result: "fail", message: "Location not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.json({ type: "result", result: "fail", message: "Unable to delete location" });
  }
}
);

export default router;
