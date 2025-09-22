import express from 'express';
import { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics, CompanyCertificates, Certificates } from '../models/index.js';

import { getCoords, secTest, userCompanyTest } from '../functions/utils.js'; 
import minioconnector from '../minioconnector.js';

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
      Logs.create({
        userID: null,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
      try {
        const terminals = await Logistics.findAll({
          where:{
            companyID: req.body.companyID,
          }
        });
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access granted " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ type: "result", result: "ok", message: terminals });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access not granted " + req.url + " from ip:" + req.ip,
          level: 2
        });
        res.json({ type: "result", result: "fail", message: "Unable to get terminals" });
      }
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
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
      Logs.create({
        userID: null,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
      try {
        const terminal = await Logistics.destroy({
          where: {
            id: req.body.terminalID,
            companyID: req.body.companyID,
          }
        });

        if (terminal) {
          Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted " + req.url + " from ip:" + req.ip,
            level: 1
          });
          res.json({ type: "result", result: "ok", message: "Terminal deleted successfully" });
        } else {
          Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access not granted " + req.url + " from ip:" + req.ip,
            level: 2
          });
          res.json({ type: "result", result: "fail", message: "Terminal not found or unauthorized" });
        }
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access not granted " + req.url + " from ip:" + req.ip,
          level: 2
        });
        res.json({ type: "result", result: "fail", message: "Unable to delete terminal" });
      }
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
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
      Logs.create({
        userID: null,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
      try {
        const userCompany = await UserCompany.destroy({
          where: {
            userID: req.body.userID,
            companyID: req.body.companyID,
          }
        });

        if (userCompany) {
          Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access granted " + req.url + " from ip:" + req.ip,
            level: 1
          });
          res.json({ type: "result", result: "ok", message: "User removed successfully" });
        } else {
          Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "access not granted " + req.url + " from ip:" + req.ip,
            level: 2
          });
          res.json({ type: "result", result: "fail", message: "User not found or unauthorized" });
        }
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access not granted " + req.url + " from ip:" + req.ip,
          level: 2
        });
        res.json({ type: "result", result: "fail", message: "Unable to remove user" });
      }
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
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
      var test = await userCompanyTest(token, req.body.id);
      if (test === true){
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
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access granted " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": users });
        
      }
      else{
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access not granted " + req.url + " from ip:" + req.ip,
          level: 2
        });
        return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
      }
      
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
      
    }
  }
  catch (error) {
    console.error(error);
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.status(500).json({"type":"result","result":"fail","message": "cannot get company users"});
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
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }
  var test = await userCompanyTest(token, req.body.companyID);
  if (test === true){
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
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
      res.json({ "type": "result", "result": "ok", "message": "User updated successfully" });
      
    } catch (error) {
      console.error(error);
      Logs.create({
        userID: null,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.status(500).json({ "type": "result", "result": "fail", "message": "Error updating user" });
    }
  }
  else{
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
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
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){ 
      const { companyID } = req.body;
      const userCompany = await UserCompany.findOne({
        where: { userID: decoded.id, companyID },
      });

      if (!userCompany) {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access not granted " + req.url + " from ip:" + req.ip,
          level: 2
        });
        return res.json({ "type": "result", "result": "fail", "message": "User not found in company" });
      }

      res.json({ "type": "result", "result": "ok", "message": userCompany });
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }

    
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
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
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
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
    
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
  var [result, decoded] = await secTest(token);

  if (!result) {
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    //var test = await userCompanyTest(token, req.body.companyID);
    //if (test){
      const settings = await Settings.findOne({
        where: {
          userID: decoded.id,
          key: "map"
        }
      });

      const filterSettings = settings && typeof settings.value === 'string' ? JSON.parse(settings.value) : settings?.value || {};

      const shouldFilter = Object.values(filterSettings).some(value => value === true);

      let locations = [];

      if (!shouldFilter || filterSettings.company) {
        locations = await Location.findAll({
          where: {
            type: 4
          }
        });
      }

      res.json({ type: "result", result: "ok", message: locations });
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
    /*}
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }*/
    
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
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
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
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
    
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
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
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
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access granted " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ type: "result", result: "ok", message: "Location updated successfully" });
      } else {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "Location not found or unauthorized " + req.url + " from ip:" + req.ip,
          level: 2
        });
        res.json({ type: "result", result: "fail", message: "Location not found or unauthorized" });
      }
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
    
  } catch (error) {
    console.error(error);
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
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
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
      const location = await Location.destroy({
        where: {
          id: req.body.locationID,
          companyID: req.body.companyID,
        }
      });

      if (location) {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access granted " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ type: "result", result: "ok", message: "Location deleted successfully" });
      } else {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "Location not found or unauthorized " + req.url + " from ip:" + req.ip,
          level: 2
        });
        res.json({ type: "result", result: "fail", message: "Location not found or unauthorized" });
      }
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
    
  } catch (error) {
    console.error(error);
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.json({ type: "result", result: "fail", message: "Unable to delete location" });
  }
}
);

/*
  * @route POST /company/getcertificates
  * @param {uuid} companyID 
  * @return {json}
  *   @key type @value result
  *   @key result @value ["ok", "fail"]
  *   @key message @value if fail {string} error message, if ok {array} certificates
  */
router.post('/getcertificates', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  if (!result) {
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }
  var test = await userCompanyTest(token, req.body.companyID);
  if (test === true){
    try {
      const companyCertificates = await CompanyCertificates.findAll({
        where: {
          companyID: req.body.companyID
        }
      });
      const client = await minioconnector.createConnection();
      for (const certificate of companyCertificates) {
        if (certificate.dataValues.file != null) {
          const filePath = certificate.dataValues.file; 
          const [folder, filename] = filePath.split('/'); // Split into folder and filename
          const tempLink = await minioconnector.getLink(client, folder, filename);
          certificate.dataValues.fileLink = tempLink; // Add the temporary link to the offer
        }
      }
      console.log(companyCertificates);
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
      res.json({ type: "result", result: "ok", message: companyCertificates });
    } catch (error) {
      console.error(error);
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.json({ type: "result", result: "fail", message: "Unable to get certificates" });
    }
  }
  else{
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
  }
});

/*
  * @route POST /company/addcertificate
  * @param {uuid} companyID
  * @param {string} type
  * @param {string} name
  * @param {string} description
  * @param {string} file
  * @return {json}
  *   @key type @value result
  *   @key result @value ["ok", "fail"]
  *   @key message @value if fail {string} error message, if ok {string} success message 
  */
router.post('/addcertificate', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  if (!result) {
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }
  try {
    var body = req.body;
    var test = await userCompanyTest(token, body.companyID);
    if (test === true){
      const certificate = await CompanyCertificates.create({
        companyID: body.companyID,
        type: body.type,
        name: body.name,
        description: body.description
      });
      if (body.file64 !=null && body.file64 != undefined && body.file64 != ""){
        const client = await minioconnector.createConnection();
        try{
          const dataUrl = body.file64;
          const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            throw new Error("Invalid data URL format");
          }
          const mimeType = matches[1]; // Extract MIME type
          const base64Data = matches[2]; // Extract base64 data
          const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 to buffer
          const folder = 'certificates'; // Define the bucket/folder name
          let fileExt = ''; 
          if (body.filename && body.filename.includes('.')) {
              const extMatch = body.filename.match(/\.[0-9a-z]+$/i);
              fileExt = extMatch ? extMatch[0] : ''; 
            }
          const filename = `${certificate.id}${fileExt}`; // Generate a unique filename
              
          // Upload the file to MinIO
          await minioconnector.insert(client, buffer, filename, folder);
          await CompanyCertificates.update({
            file: `${folder}/${filename}`
          }, {
            where: {
              id: certificate.id
            }
          });
        }
        catch (error) {
          console.error("Error uploading file to MinIO:", error);
        }
      }
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
      res.json({ type: "result", result: "ok", message: certificate });
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
    
  } catch (error) {
    console.error(error);
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.json({ type: "result", result: "fail", message: "Unable to add certificate" });
  }
});

/*
* @route POST /company/editcertificate
* @param {uuid} certificateID
* @param {string} type
* @param {string} name
* @param {string} description
* @param {string} file
* @return {json}
*   @key type @value result
*   @key result @value ["ok", "fail"]
*   @key message @value if fail {string} error message, if ok {string} success message 
*/
router.post('/editcertificate', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  if (!result) {
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }
  try {
    var body = req.body;
    var test = await userCompanyTest(token, body.companyID);
    if (test === true){
      const certificate = await CompanyCertificates.findOne({
        where: {
          id: body.certificateID,
          companyID: body.companyID
        }
      });
      if (!certificate) {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "Certificate not found or unauthorized " + req.url + " from ip:" + req.ip,
          level: 2
        });
        return res.json({ type: "result", result: "fail", message: "Certificate not found or unauthorized" });
      }
      certificate.type = body.type;
      certificate.name = body.name;
      certificate.description = body.description;
      await certificate.save();
      if (body.file64 !=null && body.file64 != undefined && body.file64 != ""){
        const client = await minioconnector.createConnection();
        try{
          const dataUrl = body.file64;
          const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            throw new Error("Invalid data URL format");
          }
          const mimeType = matches[1]; // Extract MIME type
          const base64Data = matches[2]; // Extract base64 data
          const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 to buffer
          const folder = 'certificates'; // Define the bucket/folder name
          console.log("filename", body.filename);
          let fileExt = ''; 
          if (body.filename) {
              const extMatch = body.filename.match(/\.[0-9a-z]+$/i);
              fileExt = extMatch ? extMatch[0] : ''; 
          }
          console.log("fileExt", fileExt);
          const filename = `${certificate.id}${fileExt}`; // Generate a unique filename
              
          // Upload the file to MinIO
          await minioconnector.insert(client, buffer, filename, folder);
          await CompanyCertificates.update({
            file: `${folder}/${filename}`
          }, {
            where: {
              id: certificate.id
            }
          });
        }
        catch (error) {
          console.error("Error uploading file to MinIO:", error);
        }
      }
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
      res.json({ type: "result", result: "ok", message: certificate });
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
  } catch (error) {
    console.error(error);
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.json({ type: "result", result: "fail", message: "Unable to edit certificate" });
  }
});

/* @route POST /company/removecertificate
 * @param {uuid} certificateID
 * @param {uuid} companyID
 * @return {json}
 *   @key type @value result
 *   @key result @value ["ok", "fail"]
 *   @key message @value if fail {string} error message, if ok {string} success message 
 */
router.post('/removecertificate', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  if (!result) {
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }
  try {
    var test = await userCompanyTest(token, req.body.companyID);
    if (test === true){
      const certificate = await CompanyCertificates.destroy({
        where: {
          id: req.body.certificateID,
          companyID: req.body.companyID
        }
      });

      if (certificate) {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access granted " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ type: "result", result: "ok", message: "Certificate deleted successfully" });
      } else {
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "Certificate not found or unauthorized " + req.url + " from ip:" + req.ip,
          level: 2
        });
        res.json({ type: "result", result: "fail", message: "Certificate not found or unauthorized" });
      }
    }
    else{
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
    }
  } catch (error) {
    console.error(error);
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.json({ type: "result", result: "fail", message: "Unable to delete certificate" });
  }
});

/* @route POST /company/contracts
  * @param {uuid} companyID
  * @return {json}
  *   @key type @value result
  *   @key result @value ["ok", "fail"]
  *   @key message @value if fail {string} error message, if ok {array} contracts
*/
router.post('/contracts', async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  if (!result) {
    Logs.create({
      userID: null,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    return res.json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }
  var test = await userCompanyTest(token, req.body.companyID);
  if (test === true){
    try {
      const contracts = await Contract.findAll({
        include: [
          {
            model: Offer,
            include: [
              { model: User, attributes: ["id", "name", "email", "phone", "isPremiumUser"] },
              { model: Company, attributes: ["id", "name", "address", "zipcode", "city"] }
            ]
          },
          {
            model: User, attributes: ["id", "name", "email", "phone", "isPremiumUser"]
          },
          {
            model: Company, attributes: ["id", "name", "address", "zipcode", "city"]
          }
        ],
        where: {
          companyID: req.body.companyID
        }
      });
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted " + req.url + " from ip:" + req.ip,
        level: 1
      });
      res.json({ type: "result", result: "ok", message: contracts });
    } catch (error) {
      console.error(error);
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access not granted " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.json({ type: "result", result: "fail", message: "Unable to get contracts" });
    }
  }
  else{
    Logs.create({
      userID: decoded.id,
      action: req.url,
      text: "access not granted " + req.url + " from ip:" + req.ip,
      level: 2
    });
    res.json({ "type": "result", "result": "fail", "message": "Unauthorized access to company" });
  }
});

export default router;
