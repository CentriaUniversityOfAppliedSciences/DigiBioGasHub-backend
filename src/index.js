/* 
* importing nodejs modules and starting express server
* uses morgan and helmet for logging and security
* sequelize is used for database connection
*/
import express from 'express';
var app = express();
var port = process.env.SERVER_PORT;
import multer from 'multer';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from "jsonwebtoken";
import cryptic from './cryptic.js';
import bodyParser from 'body-parser';
import sendEmail from './email/emailService.js';
import buyerEmailTemplate from './email/buyerEmailTemplate.js';
import sellerEmailTemplate from './email/sellerEmailTemplate.js';
import invitationEmailTemplate from './email/invitationEmailTemplate.js';
import companyApprovalReqTemplate from './email/companyApprovalReqTemplate.js';
import { OFFER_UNITS, OFFER_CARGOTYPE, MATERIAL_TYPE } from './constants/constants.js';
import logisticsRouter from './routes/logistics.js';
import adminRouter from './routes/admin.js';
import companyRouter from './routes/company.js';
import subscriptionRouter from './routes/subscription.js';
import checkoutRouter from './routes/checkout.js';
import stripewebhookRouter from './routes/stripewebhook.js';
import apikeyRouter from './routes/apikey.js';
import { getCoords, secTest, adminTest } from './functions/utils.js';
import sharp from 'sharp';
import * as rfs from 'rotating-file-stream';
import path from 'path';
import './scheduler/subscriptionExpJob.js';
var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(import.meta.dirname, 'log')
})

app.use(morgan('combined', { stream: accessLogStream }));
app.use(helmet({

}));
app.disable('x-powered-by');
import sequelize from './models/database.js';
import { Op } from 'sequelize';
import minioconnector from './minioconnector.js';
import { Hub, User,  Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics, Openapi, OfferCertificates, CompanyCertificates } from './models/index.js';

sequelize.sync({ alter: false }).then(async ()=>{ // change alter:true if you want to update the database schema, fill in missing values in db manually, not for production
    const hubCount = await Hub.count();
    if (hubCount === 0) {
        await Hub.create({
            id: 1,
            name: process.env.HUB_NAME,
            type: 1,
            origin: process.env.HUB_ORIGIN
        });
    }

    const userCount = await User.count();
    if (userCount === 0) {
        var pass = await cryptic.hash(process.env.HUB_ADMIN_PASS);
        await User.create({
            username: process.env.HUB_ADMIN_USER,
            password: pass,
            name: "Admin",
            email: "",
            phone: "",
            authMethod: "local",
            userlevel: 99,
            isPremiumUser: true,
            hubID: 1
        });
    }
  //console.log("created");
}).catch((e)=>{
  console.log(e);
});
0
/*
* testing if connection origin is allowed, origins in Hubs table in database
*/

var corsOptionsDelegate = async function (req,callback) {
  var corsOptions;
  //origin: async function (origin, callback) {
    // db.loadOrigins is an example call to load
    // a list of origins from a backing database
    var origin = req.header('Origin');
    console.log(origin);
    if (origin != null || origin != undefined){
      const hub = await Hub.findOne({ 
        where: { origin: origin }
      });
      if (hub != null && hub.dataValues != null && hub.dataValues.type == 1){
        console.log("origin is ok");
        corsOptions = { origin: true }
      }
      else{
        console.log("origin is not ok1");
        corsOptions = { origin: false }
      }
    }
    else{
      console.log("origin is not ok2");
      corsOptions = { origin: false }
    }
  
    callback(null, corsOptions);
    
  //}
}
app.use(cors(corsOptionsDelegate));
app.use('/webhook', stripewebhookRouter);
//app.use(express.bodyParser({limit: '1500mb' }));
//app.use(express.json({limit: '200mb' }));
//app.use(express.urlencoded({limit: '200mb', extended: true }));
app.use(bodyParser.json({limit: '200mb'}));
// For multipart/form-data (file uploads), use multer. Example:
// const multer = require('multer');
// const upload = multer({ limits: { fileSize: 1500 * 1024 * 1024 } });
// app.post('/upload', upload.single('file'), (req, res) => { ... });


/*
*  checking jwt token, if token is not present or invalid, returns 401
* /login, /register and /stations are allowed without token
*/

app.use(async (req, res, next) => {
  if (req.url == '/login' || req.url == '/register' || req.url == '/stations' || req.url == '/webhook'){ 
    if (req.method == 'POST' || req.method == 'GET'){
      await Logs.create({
        userID: null,
        action: req.url,
        text: "jwt check not needed, page access granted, for page " + req.url + " from ip:" + req.ip,
        level: 1
      });
    }
    next();
  }
  else if (req.url == '/getusername' || req.url == '/getallusers'  ){
    const apikey = req.headers['x-api-key'];
    if (apikey == process.env.CHAT_SERVER_API_KEY){
      await Logs.create({
        userID: null,
        action: req.url,
        text: "apikey check, page access granted, for page " + req.url + " from ip:" + req.ip,
        level: 1
      });
      next();
    }
    else{
      await Logs.create({
        userID: null,
        action: req.url,
        text: "apikey check, page access failed, for page " + req.url + " from ip:" + req.ip,
        level: 3
      });
      return res.status(401).json({ "type":"result","result":"fail","message": 'error' });
    }
  }
  else{
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ "type":"result","result":"fail","message": 'error' });
    }
    try {
        var [result,decoded] = await secTest(token);
        if (result){
          await Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "jwt check, page access granted:" + req.url + " for user:" + decoded.id + " from ip:" + req.ip,
            level: 1
          });
          next();
        }
        else{
          if (decoded != null&& decoded != undefined && decoded.id != null && decoded.id != undefined){
            await Logs.create({
              userID: decoded.id,
              action: req.url,
              text: "jwt check, page access failed, invalid jwt token for: " + req.url + " for user:" + decoded.id + " from ip:" + req.ip,
              level: 3
            });
          }
          
          return res.status(401).json({ "type":"result","result":"fail","message": 'error' });
        }
    } catch (error) {
      if (decoded != null&& decoded != undefined && decoded.id != null && decoded.id != undefined){
        await Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "jwt check, page access failed, for page " + req.url +  " error: " + error + " for user:" + decoded.id + " from ip:" + req.ip,
          level: 3
        });
      }
      else{
        await Logs.create({
          userID: null,
          action: req.url,
          text: "jwt check, page access failed, for page " + req.url + "error: " + error + " from ip:" + req.ip,
          level: 3
        });
      }
      console.log(error);
        res.status(401).json({ "type":"result","result":"fail","message": 'error' });
    }
  }
})



/*
* @route POST /login
* @param {string} username
* @param {string} password
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key token @value jwt token
*/
app.post("/login", async (req, res) => {
  var body = req.body;
  const userVal = await User.findOne({
    where:{
      username: body.username,
      authMethod: "local"
    }
  });
  if (userVal != undefined && userVal != null && userVal.dataValues != undefined && userVal.dataValues != null){
    var user = userVal.dataValues;
    if (await cryptic.compare(body.password,user.password)){
      delete user.password;
      const token = jwt.sign(user, process.env.JWT_KEY);
      
      res.json({
        "type":"result",
        "result":"ok",
        "token":token
      });
      await Logs.create({
        userID: user.id,
        action: req.url,
        text: "user logged in, for page " + req.url + " from ip:" + req.ip,
        level: 1
      });
    }
    else{
      res.json({
        "type":"result",
        "result":"fail"
      });
      await Logs.create({
        userID: null,
        action: req.url,
        text: "user failed to login, for page " + req.url + " from ip:" + req.ip,
        level: 2
      });
    }
  }
  
  else{
    res.json({
      "type":"result",
      "result":"fail"
    });
    await Logs.create({
      userID: null,
      action: req.url,
      text: "user failed to login, for page " + req.url + " from ip:" + req.ip,
      level: 2
    });
  }
  
});

/*
* @route POST /language
* @param {uuid} id 
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {string} success message
*/
app.post("/language", async (req, res) => {
  try {
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(401).json({ "type": "result", "result": "fail", "message": "No token provided", });
    }

    const [result, decoded] = await secTest(token);

    if (!result || !decoded || !decoded.id) {
      return res.status(401).json({ "type": "result", "result": "fail", "message": "Invalid or expired token",
      });
    }

    const userId = decoded.id;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ "type": "result", "result": "fail", "message": "Missing language parameter" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ "type": "result", "result": "fail", "message": "User not found",
      });
    }

    user.language = language;
    await user.save();

    return res.status(200).json({ "type": "result", "result": "ok", "message": "Changed Successfully!",
    });

  } catch (error) {
    console.error("Error updating language:", error);
    return res.status(500).json({ "type": "result", "result": "fail", "message": "Internal server error",
    });
  }
});

/*
* @route POST /createcompany
* @param {string} name
* @param {string} address
* @param {string} city
* @param {string} zipcode
* @param {string} email
* @param {string} phone
* @param {integer} companyType
* @param {integer} hubID
* @param {string} web
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} company
*/

app.post("/createcompany", async (req, res) => {
  try {
    const token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);
    if (result == true && decoded.id == req.body.userID) {
      var body = req.body;
      const company = await Company.create({
        name: body.name,
        address: body.address,
        city: body.city,
        zipcode: body.zipcode,
        email: body.email,
        phone: body.phone,
        companyType: body.companyType,
        companyStatus: "0",
        hubID: "1",
        web: body.web
      });

      await UserCompany.create({
        userID: body.userID,
        companyID: company.id,
        userlevel: 23,
        CompanyId: company.id
      });

      const coords = await getCoords(body.address, body.zipcode, body.city);
      if (coords?.data?.lat && coords?.data?.lng) {
        await Location.create({
          name: body.name,
          latitude: coords.data.lat,
          longitude: coords.data.lng,
          type: 1,
          companyID: company.id,
          parent: null
        });
      }

      res.json({ "type": "result", "result": "ok", "message": company });
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "company create success, for company " + company.id + " from ip:" + req.ip,
        level: 1
      });

      const superAdmins = await User.findAll({
        where: { userlevel: 99 },
        attributes: ['email', 'language']
      });

      for (const admin of superAdmins) {
        const { subject, html } = companyApprovalReqTemplate({
          language: admin.language || 'en',
          company,
          url: process.env.FRONTEND_URL + `/admin/manage-companies`
        });

        await new Promise((resolve) => {
          sendEmail(admin.email, subject, html, (success, error) => {
            if (!success) {
              console.error("Super admin email error:", error);
            }
            resolve();
          });
        });

        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }
    else {
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
      Logs.create({
        userID: null,
        action: req.url,
        text: "company create failed unauthorized, for page " + req.url + " from ip:" + req.ip,
        level: 2
      });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "cannot create company" });
    Logs.create({
      userID: null,
      action: req.url,
      text: "company create failed, for error " + error + " from ip:" + req.ip,
      level: 3
    });
  }
});


/*
* @route POST /getusercompanies
* @where user.id = jwt_token.id
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} companies
*/
app.post("/getusercompanies", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try{
    if (result == true){
      
      const companies = await UserCompany.findAll({
        where: { userID: decoded.id },
        include: [
          {
            model: Company
          }
        ]
      });
      res.json({ "type": "result", "result": "ok", "message": companies });
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
    res.status(500).json({"type":"result","result":"fail","message": "cannot getusercompanies"});
    Logs.create({
      userID: null,
      action: req.url,
      text: "error " + error + " from ip:" + req.ip,
      level: 3
    });
  }
});

/*
* @route POST /getverifiedusercompanies
* @where user.id = jwt_token.id
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} companies
*/
app.post("/getverifiedusercompanies", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try{
    if (result == true){
      const user = await User.findOne({
        where:{
          id: decoded.id
        },
      });
      user.getCompanies({
        where: {
          companyStatus: 1 
        }
      }).then((companies) => {
        res.json({"type":"result","result":"ok", "message":companies});
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "access granted " + req.url + " from ip:" + req.ip,
          level: 1
        });
      }).
      catch((error) => {
        console.error(error);
        res.status(500).json({"type":"result","result":"fail","message": "cannot getverifiedusercompanies"});
        Logs.create({
          userID: null,
          action: req.url,
          text: "access not granted " + req.url + " from ip:" + req.ip,
          level: 2
        });
      });
    }
  }
  catch (error) { 
    console.error(error); 
    res.status(500).json({"type":"result","result":"fail","message": "cannot getverifiedusercompanies"});
    Logs.create({
      userID: null,
      action: req.url,
      text: "error " + error + " from ip:" + req.ip,
      level: 3
    });
  }
});


/*
* @route POST /companyoffers
* @param {uuid} companyID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} offers
*/

app.post("/companyoffers", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try{
    if (result == true){
      var body = req.body;
      const offers = await Offer.findAll({
        include: [Company, Material, Location, Files],
        attributes: {
          include: [
            [sequelize.col('Material.type'), 'category']
          ]
        },
        where:{
          companyID: body.companyID
        }
      });
      const client = await minioconnector.createConnection();
      // Add temporary file links to each offer
      for (const offer of offers) {
        //console.log("offer",offer);
        console.log("offer.Files",offer.Files);
        if (offer.Files != null && offer.Files.length > 0 && offer.Files[0].dataValues != null ) {
          const filePath = offer.Files[0].dataValues.data; // e.g., "offers/<filename>"
          const [folder, filename] = filePath.split('/'); // Split into folder and filename
          const tempLink = await minioconnector.getLink(client, folder, filename);
          offer.dataValues.fileLink = tempLink; // Add the temporary link to the offer
        }
      }
      res.json({"type":"result","result":"ok", "message":offers});
    }
    else{

    }
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get company offers"});
  }
});



/*
* @route POST /updatecompany
* @param {uuid} id
* @param {string} name
* @param {string} address
* @param {string} city
* @param {string} zipcode
* @param {string} email
* @param {string} phone
* @param {integer} companyType
* @param {string} web
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} company
*/

app.post("/updatecompany", async (req, res) => {
  try{
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true){
      var body = req.body;
      const company = await Company.update({
        name: body.name,
        description: body.description,
        address: body.address,
        city: body.city,
        zipcode: body.zipcode,
        email: body.email,
        phone: body.phone,
        companyType: body.companyType,
        web: body.web,
        companyStatus: 0,
        updateAt: new Date()
      },{
        where:{
          id: body.id
        }
      });
      res.json({"type":"result","result":"ok","message":company});
      Logs.create({
        userID: decoded.id,
        action: req.url,
        text: "access granted: " + req.url + " from ip:" + req.ip,
        level: 1
      });
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "not authorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot update company"});
    Logs.create({
      userID: null,
      action: req.url,
      text: "error: " + error + " from ip:" + req.ip,
      level: 3
    });
  }
});


/*
* @route POST /getuser
* @param {uuid} id
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} user
*/

app.post("/getuser", async (req, res) => {
  try{
    var body = req.body;
    const user = await User.findOne({
      where:{
        id: body.id
      },
      attributes: { exclude: ['password'] }
    });
    res.json({"type":"result","result":"ok","message":user});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get user"});
  }
});

/*
* @route POST /getallusers
* @return {json}
  * @key type @value result
  * @key result @value {json} users
*/
app.post("/getallusers", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes:["id", "name"],
    });
    const allowedUsers = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const setting = await Settings.findOne({
        where: {
          userID: user.id,
          key: "chat"
        }
      });
      if (setting){
        let valueObj = {};
        try{
          valueObj = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
        }catch (error) {
          valueObj = {};
        }
        if (valueObj.chatVisibility === true) {
          allowedUsers.push(user);
        }
      }
    };
    res.json({ type: "result", result: "ok", message: allowedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: "result", result: "fail", message: "cannot get users" });
  }
});

/*
* @route POST /getUsername
* @param {uuid} id
* @return {json}
  * @key type @value result
  * @key result @value {json} users
*/
app.post("/getusername", async (req, res) => {
  try {
    var body = req.body;
    const user = await User.findOne({
      where:{
        id: body.id
      },
      attributes:["username"]
    });
    res.json({ type: "result", result: "ok", message: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: "result", result: "fail", message: "cannot get username" });
  }
});


/* user updates their own profile, uses jwt token for user id */
/* @route POST /updateuser
* @param {string} name
* @param {string} email
* @param {string} phone
* @param {string} address
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value updated user
*/

app.post("/updateuser", async (req, res) => {
  try{
    var body = req.body;
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true){
      const user = await User.update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
      },{
        where:{
          id: decoded.id
        }
      });
      res.json({"type":"result","result":"ok","message":user});
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot update user"});
  }
});




/*
* @route POST /deleteuser
* @param {uuid} id
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} user
*/

app.delete("/deleteuser", async (req, res) => {
  let tempID = null;
  try{
    var body = req.body;
    const user = await User.destroy({
      where:{
        id: body.id
      }
    }).then(()  => {
      UserCompany.findAll({
        where:{
          userID: body.id
        }
      }).then((usercompanies) => {
        usercompanies.forEach((usercompany) => {
          tempID = usercompany.dataValues.id;
          UserCompany.destroy({
            where:{
              userID: body.id
            }
          });
          if (tempID != null){
            const comp = UserCompany.findOne({
              where:{
                id: tempID
              }
            });
            if (comp){
              UserCompany.update({
                userlevel: 23,
                where:{
                  companyID: comp.dataValues.companyID
                }
              })
            }
            else{
              Company.destroy({
                where:{
                  id: tempID
                }
              });
            }
          }
        });
      });
    }
    );
    res.json({"type":"result","result":"ok","message":user});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot delete user"});
  }
});

/*
* @route POST /deletecompany
* @param {uuid} id
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} company
*/

app.post("/deletecompany", async (req, res) => {
  try{
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true){
      var body = req.body;
      await Offer.destroy({ where: { companyID: body.id } });
      const company = await Company.destroy({
        where:{
          id: body.id
        }
      }).then(() => { 
        UserCompany.destroy({
          where:{
            companyID: body.id
          }
        });
      });
      res.json({"type":"result","result":"ok","message":company});
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot delete company"});
  }
}
);

/*
* @route POST /createlocation
* @param {string} name
* @param {double} latitude
* @param {double} longitude
* @param {integer} type
* @param {uuid} companyID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} location
*/

app.post("/createlocation", async (req, res) => {
  try{
    var body = req.body;
    const location = await Location.create({
      name: body.name,
      latitude: body.latitude,
      longitude: body.longitude,
      type: body.type,
      companyID: body.companyID
    });
    res.json({"type":"result","result":"ok","message":location});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot create location"});
  }
});

/*
* @route POST /getlocations
* @param {uuid} companyID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} locations
*/

app.post("/getlocations", async (req, res) => {
  try{
    const locations = await Location.findAll({
      where:{
        companyID: req.body.companyID
      }
    });
    res.json({"type":"result","result":"ok","message":locations});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get locations"});
  }
});

/*
* @route POST /createoffer
* @param {integer} type
* @param {integer} materialID
* @param {uuid} companyID
* @param {integer} locationID
* @param {integer} unit (see unit-help file)
* @param {float} price
* @param {float} amount
* @param {date} startDate
* @param {date} endDate
* @param {float} availableAmount
* @param {uuid} creator
* @param {integer} status
* @param {integer} cargoType
* @param {integer} visibility
* @param {string} description
* @param {string} image64
* @param {string} fileName
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offer
*/

app.post("/createoffer", async (req, res) => {
  try{
    var body = req.body;
    const token = req.headers['authorization'];

    const company = await Company.findOne({
      where: {
        id: body.companyID
      }
    });

    if (company == null || company.dataValues == null || company.dataValues.companyStatus != 1) {
      return res.json({ "type": "result", "result": "fail", "message": "Invalid Company" });
    }

    try {
        var [result,decoded] = await secTest(token);
        const offer = await Offer.create({
          type: body.type,
          materialID: body.materialID,
          companyID: body.companyID,
          locationID: body.locationID,
          unit: body.unit,
          price: body.price,
          amount: body.amount,
          startDate: body.startDate,
          endDate: body.endDate,
          availableAmount: body.amount,
          creator: decoded.id,
          status: 1,
          cargoType: body.cargoType,
          visibility: body.visibility,
          description: body.description
        });
        if (body.image64 != null && body.image64 != undefined && body.image64 != ""){
          
          const client = await minioconnector.createConnection();
          try {
            const dataUrl = body.image64; // Base64 Data URL
            const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);

            if (!matches || matches.length !== 3) {
              throw new Error('Invalid base64 Data URL');
            }

            const mimeType = matches[1]; // Extract MIME type
            const base64Data = matches[2]; // Extract base64 data
            const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 to buffer
            const newImage = await sharp(buffer).resize(800, 600, { fit: sharp.fit.inside, withoutEnlargement: true}).toBuffer(); // Resize the image to 800x600
              
            const folder = 'offers'; // Define the bucket/folder name
            const filename = `${offer.id}_${body.imageName}`; // Generate a unique filename

            // Upload the file to MinIO
            await minioconnector.insert(client, newImage, filename, folder);
                    
            // Save the reference to the file in the database
            const file = await Files.create({
              name: body.imageName,
              type: 1,
              parent: offer.id,
              data: `${folder}/${filename}` // Reference to the MinIO file
            });
          } catch (error) {
            console.error('Error uploading file to MinIO:', error);
            throw new Error('Failed to upload file to MinIO');
          }

        }
        if (body.certificates != null && body.certificates != undefined && body.certificates.length > 0){
          for (const certificate of body.certificates){
            await OfferCertificates.create({
              offerId: offer.id,
              certificateId: certificate
            });
          }
        }
        if (body.address != null && body.address != undefined && body.city != null && body.city != undefined && body.zipcode != null && body.zipcode != undefined){
          const coords = await getCoords(body.address, body.zipcode, body.city);
          if (coords.data != null && coords.data != undefined && coords.data.lat != null && coords.data.lng != null){
            const location = await Location.create({
              name: offer.id,
              latitude: coords.data.lat,
              longitude: coords.data.lng,
              type: 2,
              companyID: body.companyID,
              parent: offer.id,
              address: body.address,
              zipcode: body.zipcode,
              city: body.city
            });
          }
          else{
            const location = await Location.create({
              name: offer.id,
              latitude: 0.0,
              longitude: 0.0,
              type: 2,
              companyID: body.companyID,
              parent: offer.id,
              address: body.address,
              zipcode: body.zipcode,
              city: body.city
            });
          }
        }
        res.json({"type":"result","result":"ok","message":offer});
    }
    catch (error2) {
      console.log(error2);
      res.status(500).json({"type":"result","result":"fail","message": "cannot create offer"});
    };
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot create offer"});
  }
});

/*
* @route POST /updateoffer
* @param {uuid} id
* @param {integer} type
* @param {integer} materialID
* @param {uuid} companyID
* @param {integer} locationID
* @param {integer} unit 
* @param {float} price
* @param {float} amount
* @param {date} startDate
* @param {date} endDate
* @param {float} availableAmount
* @param {integer} status
* @param {integer} cargoType
* @param {integer} visibility
* @param {string} description
* @param {string} image64
* @param {string} fileName
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offer
*/
app.post("/updateoffer", async (req, res) => {
  try{
    var body = req.body;
    const token = req.headers['authorization'];
    
    try {
        var [result,decoded] = await secTest(token);
        const offer = await Offer.update({
          type: body.type,
          materialID: body.materialID,
          companyID: body.companyID,
          locationID: body.locationID,
          unit: body.unit,
          price: body.price,
          amount: body.amount,
          startDate: body.startDate,
          endDate: body.endDate,
          availableAmount: body.amount,
          status: 1,
          cargoType: body.cargoType,
          visibility: body.visibility,
          description: body.description,
          updateAt: new Date()
        },{
          where:{
            id: body.id
          }
        });
        if (body.image64 != null && body.image64 != undefined && body.imageChanged == true){
          
          const client = await minioconnector.createConnection();
          try {
            const dataUrl = body.image64; // Base64 Data URL
            const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);

            if (!matches || matches.length !== 3) {
              throw new Error('Invalid base64 Data URL');
            }

            const mimeType = matches[1]; // Extract MIME type
            const base64Data = matches[2]; // Extract base64 data
            const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 to buffer

            const folder = 'offers'; // Define the bucket/folder name
            const filename = `${body.id}_${body.imageName}`; // Generate a unique filename

            // Upload the file to MinIO
            await minioconnector.insert(client, buffer, filename, folder);
                    
            // Save the reference to the file in the database
            const file = await Files.create({
              name: body.imageName,
              type: 1,
              parent: body.id,
              data: `${folder}/${filename}` // Reference to the MinIO file
            });
            console.log("oldImage",body.oldImage);
            await minioconnector.deleteFile(client, folder, body.oldImage);
            await Files.destroy({
              where:{
                id: body.oldImageId
              }
            });
          } catch (error) {
            console.error('Error uploading file to MinIO:', error);
            throw new Error('Failed to upload file to file to MinIO');
          }
        }
        if (body.location != null && body.location != undefined){
          if (body.oldLocation == true){
            if (body.address != null && body.address != undefined && body.city != null && body.city != undefined && body.zipcode != null && body.zipcode != undefined){
              const coords = await getCoords(body.address, body.zipcode, body.city);
              if (coords.data != null && coords.data != undefined && coords.data.lat != null && coords.data.lng != null){
                await Location.update({
                  name: body.id,
                  latitude: coords.data.lat,
                  longitude: coords.data.lng,
                  type: 2,
                  companyID: body.companyID,
                  parent: body.id,
                  address: body.address,
                  zipcode: body.zipcode,
                  city: body.city
                },{
                  where:{
                    id: body.locationID
                  }
                });
              }
              else{
                await Location.update({
                  name: body.id,
                  latitude: 0.0,
                  longitude: 0.0,
                  type: 2,
                  companyID: body.companyID,
                  parent: body.id,
                  address: body.address,
                  zipcode: body.zipcode,
                  city: body.city
                },{
                  where:{
                    id: body.locationID
                  }
                });
              }
            }
          }
          else{
            if (body.address != null && body.address != undefined && body.city != null && body.city != undefined && body.zipcode != null && body.zipcode != undefined){
              const coords = await getCoords(body.address, body.zipcode, body.city);
              if (coords.data != null && coords.data != undefined && coords.data.lat != null && coords.data.lng != null){
                await Location.create({
                  name: body.id,
                  latitude: coords.data.lat,
                  longitude: coords.data.lng,
                  type: 2,
                  companyID: body.companyID,
                  parent: body.id,
                  address: body.address,
                  zipcode: body.zipcode,
                  city: body.city
                });
                await Offer.update({
                  locationID: location.id
                },{
                  where:{
                    id: body.id
                  }
                });
              }
              else{
                await Location.create({
                  name: body.id,
                  latitude: 0.0,
                  longitude: 0.0,
                  type: 2,
                  companyID: body.companyID,
                  parent: body.id,
                  address: body.address,
                  zipcode: body.zipcode,
                  city: body.city
                });
                await Offer.update({
                  locationID: location.id
                },{
                  where:{
                    id: body.id
                  }
                });
              }
            }
          }
        }
        
        res.json({"type":"result","result":"ok","message":offer});
    }
    catch (error2) {
      console.log(error2);
      res.status(500).json({"type":"result","result":"fail","message": "cannot update offer"});
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot update offer"});
  }
});

/*
* @route POST /deleteoffer
* @param {uuid} id
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offer
*/
app.post("/deleteoffer", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try{
    if (result == true){
      var body = req.body;
      const offer = await Offer.destroy({
        where:{
          id: body.id
        }
      });
      const fil = await Files.findAll({
        where:{
          parent: body.id
        }
      });
      for (const f of fil){
        const client = await minioconnector.createConnection();
        await minioconnector.deleteFile(client, "offers", body.id + "_" + f.name);
      }
      await Files.destroy({
        where:{
          parent: body.id
        }
      });
      res.json({"type":"result","result":"ok","message":offer});
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot delete offer"});
  }
  
});


/*
* @route POST /getoffers
* @where visibility = 1, status = 1, endDate >= now, startDate <= now
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offers
*/

app.post("/getoffers", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  if (result == false) {
    return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
  }
  try{

    const setting = await Settings.findOne({
      where: {
        userID: decoded.id,
        key: "filter"
      }
    });

    let filter = {};

    if (setting) {
      try {
        filter = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      } catch (e) {
        filter = {};
      }
    }

    const categoryToIdMap = Object.fromEntries(
      Object.entries(MATERIAL_TYPE).map(([id, name]) => [name.toLowerCase().replace(/\s+/g, ''), parseInt(id)])
    );

    const allowedTypeIds = Object.keys(filter)
    .filter(key => filter[key] === true)
    .map(key => categoryToIdMap[key.toLowerCase()])
    .filter(id => id !== undefined);
    
    const offers = await Offer.findAll({ 
      include: [Company, Location, Files,
      {
        model: Material
      }],
      attributes: {
        include: [
          [sequelize.col('Material.type'), 'category']
        ]
      },
      where:{
        visibility: 1,
        status: 1,
        sold:null,
        endDate: {
          [Op.gte]: new Date()
        },
        startDate: {
          [Op.lte]: new Date()
        }
      }
    });
    const client = await minioconnector.createConnection();

    // Add temporary file links to each offer
    for (const offer of offers) {
      if (offer.Files != null && offer.Files.length > 0 && offer.Files[0].dataValues != null) {
        const filePath = offer.Files[0].dataValues.data; // e.g., "offers/<filename>"
        const [folder, filename] = filePath.split('/'); // Split into folder and filename
        const tempLink = await minioconnector.getLink(client, folder, filename);
        offer.dataValues.fileLink = tempLink; // Add the temporary link to the offer
      }

      const offerType = offer.Material?.type;
      offer.dataValues.matchesFilter = allowedTypeIds.includes(offerType);
    }
    res.json({"type":"result","result":"ok", "message":offers, "filtered": allowedTypeIds.length > 0, "appliedFilter": filter});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get offers"});
  }
});

/*
* @route POST /getuseroffers
* @param {uuid} userID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offers
*/
app.post("/getuseroffers", async (req, res) => {
  try{
    var body = req.body;
    var token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true && decoded.id == body.id){
      const offers = await Offer.findAll({
        where:{
          creator: decoded.id
        }
      });
      res.json({"type":"result","result":"ok", "message":offers});
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get offers"});
  }
});

app.post("/buyoffer", async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const [result, decoded] = await secTest(token);
    const body = req.body;

    const offer = await Offer.findOne({
      where: { id: body.offerId },
      include: [
        {
          model: Company
        },
        {
          model: Material,
          attributes: ['name', 'description', 'type', 'quality']
        }
      ]
    });

    if (!offer) {
      return res.status(404).json({ type: "result", result: "fail", message: "Offer not found" });
    }

    const company = offer.Company;

    const contract = await Contract.create({
      offerID: body.offerId,
      buyer: decoded.id,
      price: body.price,
      amount: body.amount,
      unit: body.unit,
      companyID: body.companyID,
      status: "completed"
    });

    const remaining = offer.availableAmount - body.amount;
    const isSoldOut = remaining <= 0;

    const updateData = isSoldOut
      ? { sold: Date.now(), availableAmount: 0 }
      : { availableAmount: remaining };

    await Offer.update(updateData, { where: { id: body.offerId } });

    // Send emails if companyType is logistic
    if (company && company.companyType === 5) {

      const buyer = await User.findOne({ where: { id: decoded.id } });

      const offerData = {
        description: offer.description,
        cargoType: OFFER_CARGOTYPE[offer.cargoType] || 'unknown',
        unit: OFFER_UNITS[offer.unit] || 'not available',
      };

      const materialData = {
        name: offer.Material.name,
        description: offer.Material.description,
        type: MATERIAL_TYPE[offer.Material.type] || 'unknown',
        quality: offer.Material.quality,
      };

      const { html: buyerMsgHTML, buyerSubject } = await buyerEmailTemplate({
        buyer,
        amount: body.amount,
        price: body.price,
        offer: offerData,
        material: materialData,
        isSoldOut,
        company
      });

      const { html:sellerMsgHTML, sellerSubject } = await sellerEmailTemplate({
        buyer,
        amount: body.amount,
        price: body.price,
        offer: offerData,
        material: materialData,
        company
      });

      sendEmail(buyer.email, buyerSubject, buyerMsgHTML, (success, error) => {
        if (!success) console.log("Buyer email error:", error);
      });
      
      sendEmail(company.email, sellerSubject, sellerMsgHTML, (success, error) => {
        if (!success) console.log("Seller email error:", error);
      });
    }

    res.json({ type: "result", result: "ok", message: contract });

  } catch (error) {
    console.error("Buy offer error:", error);
    res.status(500).json({ type: "result", result: "fail", message: "Cannot buy offer" });
  }
});

/*
* @route POST /offercontracts
* @param {uuid} offerID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} contracts
*/
app.post("/offercontracts", async (req, res) => {
  var token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try{
    if (result == true){
      var body = req.body;
      const contracts = await Contract.findAll({
        include: [
          {
            model: Offer, 
            include:[
              { model: User, attributes: ["id", "name", "email", "phone"] },
              { model: Company, attributes: ["id", "name", "address", "zipcode", "city"] }
            ]
          },
          User, Company
          
        ],
        where:{
          offerID: body.id
        }
      });
      res.json({"type":"result","result":"ok", "message":contracts});
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get contracts"});
  }
});

/*
* @route POST /contracts
* @param {uuid} userID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} contracts
*/
app.post("/contracts", async (req, res) => {
  var token = req.headers['authorization'];
  var [result, decoded] = await secTest(token);
  try {
    if (result == true) {
      var body = req.body;
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
          buyer: decoded.id
        }
      });
      res.json({"type":"result","result":"ok", "message":contracts});
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get contracts"});
  }
});


/*
route POST /updatesettings
* @param {json} settings
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} settings
*/
app.post("/updatesettings", async (req, res) => {
  try{
    var body = req.body;
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true){
      var sett = body.settings;
      if (sett != null && sett != undefined){
        var keys = Object.keys(sett);
        var values = Object.values(sett);
        console.log("values", values);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = values[i];
          const [affectedRows] = await Settings.update(
            { value: value },
            {
              where: {
                userID: decoded.id,
                key: key
              }
            }
          );
          if (affectedRows === 0) {
            await Settings.create({
              userID: decoded.id,
              key: key,
              value: value
            });
          }
        }
          /**/
        res.json({"type":"result","result":"ok","message":"settings logged"});
        
      }
      
      //res.json({"type":"result","result":"ok","message":settings});
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot save settings"});
  }
});

/* route POST /getsettings
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {array} settings
*/
app.post("/getsettings", async (req, res) => {
  try{
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true){
      const settings = await Settings.findAll({
        where:{
          userID: decoded.id
        }
      });
      res.json({"type":"result","result":"ok","message":settings});
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get settings"});
  }
});



/* 
* @route POST /getmaterials
* @return {json}
  * @key type @value result
  * @key result @value {json} materials
*/

app.post("/getmaterials", async (req, res) => {
  console.log("getmaterials");
  try{
    const materials = await Material.findAll({
      where:{
        locality: req.body.locality
      }
    });
    res.json({"type":"result","result":"ok","message":materials});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get materials"});
  }
});

/* 
* @route POST /getoffersbycompany
* @param {uuid} companyID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offers
*/

app.post("/getoffersbycompany", async (req, res) => {
  try{
    var body = req.body;
    const offers = await Offer.findAll({
      where:{
        companyID: body.companyID
      }
    });
    const client = await minioconnector.createConnection();

    // Add temporary file links to each offer
    for (const offer of offers) {
      if (offer.Files != null && offer.Files[0].dataValues != null) {
        const filePath = offer.Files[0].dataValues.data; // e.g., "offers/<filename>"
        const [folder, filename] = filePath.split('/'); // Split into folder and filename
        const tempLink = await minioconnector.getLink(client, folder, filename);
        offer.dataValues.fileLink = tempLink; // Add the temporary link to the offer
      }
    }
    res.json({"type":"result","result":"ok", "message":offers});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get offers"});
  }
});

/*

* @route POST /getoffersbyid
* @where id = req.body.id
* @param {uuid} id
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} offer
*/

app.post("/getoffersbyid", async (req, res) => {
  try{
    var body = req.body;
    const offer = await Offer.findOne({
      include: [Company, Material, Location, Files],
      attributes: {
        include: [
          [sequelize.col('Material.type'), 'category']
        ]
      },
      where:{
        id: body.id
      }
    });
    const client = await minioconnector.createConnection();

    // Add temporary file links to each offer
    
      if (offer.Files != null && offer.Files.length > 0 &&offer.Files[0].dataValues != null) {
        const filePath = offer.Files[0].dataValues.data; // e.g., "offers/<filename>"
        const [folder, filename] = filePath.split('/'); // Split into folder and filename
        const tempLink = await minioconnector.getLink(client, folder, filename);
        offer.dataValues.fileLink = tempLink; // Add the temporary link to the offer
      }
    
    res.json({"type":"result","result":"ok", "message":offer});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get offers"});
  }
});
/*
* @route POST /register
* @param {string} username
* @param {string} password
* @param {string} name
* @param {string} email
* @param {string} phone
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/

app.post("/register", async (req, res) => {
  try{
    var body = req.body;
    const pass = await cryptic.hash(req.body.password);
    await User.create({
      username: body.username,
      password: pass,
      name: body.name,
      email: body.email,
      phone: body.phone,
      authMethod: "local",
      userlevel: 1,
      hubID: 1
    });
    res.json({"type":"result","result":"ok"});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot register"});
  }
});

/*
* @route POST /stations
* @return {json} 
  * @key type @value result
  * @key result @value {json} stations
*/

app.post("/stations", async (req, res) => {
  try{
    var body = req.body;
    var url = "https://www.gasum.com/api/stations?language=fi";
    axios.get(url,{withCredentials: false}).then((response) => {
        res.json({"type":"result","result":response.data});
    }).catch((error) => {  console.log(error); });
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot register"});
  }
});


/*
* @route POST /getblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} blog post
*/
app.post("/getblogpost", async (req, res) => {

  try {
    var body = req.body;
    const blogpost = await BlogPost.findOne({
      where: {
        postID: body.postID
      }
    });
    if (blogpost != null) {
      if (blogpost.dataValues.blogPostType === 3) {
        const filePath = blogpost.content;
        const [folder, filename] = filePath.split('/'); // Split into folder and filename
        const client = await minioconnector.createConnection();
        const tempLink = await minioconnector.getLink(client, folder, filename);
        blogpost.dataValues.link = tempLink; // Add the temporary link to the blog post
      }
      res.json({ "type": "result", "result": "ok", "message": blogpost });

    } else {
      res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get blog post" });
  }
});


/*
* @route POST /getlatest4blogposts
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} blog posts
*/
app.post("/getlatest4blogposts", async (req, res) => {
  try {
    const blogposts = await BlogPost.findAll({
      where: {
        [Op.or]: [
          { blogPostType: 1 },
          { blogPostType: 3 }
        ]
      },
      limit: 4,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['content'] }
    });
    res.json({ "type": "result", "result": "ok", "message": blogposts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get blog posts" });
  }
}
);


/*
* @route POST /getpublishedblogposts
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} blog posts
*/
app.post("/getallpublishedblogposts", async (req, res) => {
  try {
    const blogposts = await BlogPost.findAll({
      where: {
        [Op.or]: [
          { blogPostType: 1 },
          { blogPostType: 3 }
        ]
      }
    });
    res.json({ "type": "result", "result": "ok", "message": blogposts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get blog posts" });
  }
}
);


/*
* @route POST /invitemembers
* @param {string} email
* @param {uuid} companyID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} invitation
*/
app.post("/company-admin/invitemembers", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);

  const hasPermission = decoded?.userlevel === 23 || decoded?.userlevel === 99;

  if (!result && !hasPermission) {
    return res.status(401).json({ type: "result", result: "fail", message: "Unauthorized access" });
  }
  
  var body = req.body;
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {

    const existingInvitation = await Invitation.findOne({
      where: {
        email: body.email,
        companyID: body.companyID,
        status: "pending"
      }
    });

    if (existingInvitation) {
      const currentDate = new Date();
      if (new Date(existingInvitation.expiryDate) >= currentDate) {
        return res.json({ "type": "result", "result": "fail", "message": "Member is already invited to this company" });
      } else {
        await Invitation.destroy({
          where: {
            id: existingInvitation.id
          }
        });
      }
    }

    const user = await User.findOne({
      where: {
        email: body.email
      }
    });
    if (user) {
      const existingAssociation = await UserCompany.findOne({
        where: {
          userID: user.id,
          companyID: body.companyID
        }
      });

      if (existingAssociation) {
        return res.json({ "type": "result", "result": "fail", "message": "Member is already associated with this company" });
      }
    }

    const invitation = await Invitation.create({
      email: body.email,
      companyID: body.companyID,
      expiryDate: expiryDate,
      status: "pending",
      invitedById: body.invitedById,
      invitedByName: body.invitedByName
    });

    const invitationLink = process.env.SERVER_ADDRESS + `/join-company/${invitation.companyID}/${invitation.id}`;

    const { html: emailContent, subject } = await invitationEmailTemplate(user.id, body.invitedByName, body.companyName, invitationLink, expiryDate);

    sendEmail(body.email, subject, emailContent, (success, error) => {
      if (!success) {
        console.error("Failed to send invitation email:", error);
      }
    });

    res.json({ "type": "result", "result": "ok", "message": invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to invite member" });
  }
});


/*
* @route POST /api/invitations/validate
* @param {uuid} companyID
* @param {uuid} invitationId
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "alreadyMember", fail"]
  * @key message @value if fail {string} error message, if ok {string} success message
*/
app.post("/invitations/validate", async (req, res) => {

  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  
  if (!result) {
    return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access"  });
  }

  try {
    const { companyId, invitationId } = req.body;

    const invitation = await Invitation.findOne({
      where: {
        id: invitationId,
        companyID: companyId
      }
    });

    if (!invitation) {
      return res.status(404).json({ "type": "result", "result": "fail", "message": "Invitation not found" });
    }

    const currentDate = new Date();
    if (new Date(invitation.expiryDate) < currentDate) {
      return res.status(400).json({ "type": "result", "result": "fail", "message": "Invitation has expired" });
    }

    const userId = decoded.id;
    const existingAssociation = await UserCompany.findOne({
      where: {
        userID: userId,
        companyID: companyId
      }
    });

    if (existingAssociation) {
      return res.status(200).json({ "type": "result", "result": "alreadyMember", "message": "User is already associated with this company" 
      });
    }

    return res.status(200).json({ "type": "result", "result": "ok", "message": "Invitation is valid" });
  } catch (error) {
    console.error("Error validating invitation:", error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to validate invitation" });
  }
});


/*
* @route POST /invitations/accept
* @param {uuid} invitationId
* @param {uuid} userId
* @param {uuid} companyId
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {string} success message
*/
app.post("/invitations/accept", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  
  if (!result) {
    return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
  }

  try {
    const userId = decoded.id;
    const { invitationId, companyId } = req.body;

    await UserCompany.create({
      userID: userId,
      companyID: companyId,
      userlevel: 20
    });

    await Invitation.destroy({
      where: {
        id: invitationId
      }
    });
   
    res.json({ "type": "result", "result": "ok", "message": "Invitation accepted successfully" });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to accept invitation" });
  }
});


/* @route POST /getOfferCertificate
* @param {uuid} offerID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} certificate
*/
app.post("/getOfferCertificate", async (req, res) => {
  const token = req.headers['authorization'];
  var [result,decoded] = await secTest(token);
  try {
    if (result == true) {
      var body = req.body;
      const cert = await OfferCertificates.findAll({
        where: {
          offerId: body.offerID
        },
        include:[CompanyCertificates]
      });
      if (!cert) {
        return res.status(404).json({ "type": "result", "result": "fail", "message": "Certificates not found" });
      } 

      // If certificate is found, return it
      return res.json({ "type": "result", "result": "ok", "message": cert });
    }
  } catch (error) {
    console.error("Error fetching offer certificate:", error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to fetch offer certificate" });
  }
});







app.use('/logistics', logisticsRouter);
app.use('/admin', adminRouter);
app.use('/company', companyRouter);
app.use ('/apikey', apikeyRouter);
app.use('/subscription', subscriptionRouter);
app.use('/payment', checkoutRouter);


//these must be at the bottom but before listen !!!!

/*app.use((req, res) => { //no redirects in use so commented
  console.log(req.query.url);
  try {
    if (new Url(req.query.url).host !== 'net.centria.fi') {
      return res.status(400).end(`Unsupported redirect to host: ${req.query.url}`)
    }
  } catch (e) {
    return res.status(400).end(`Invalid url: ${req.query.url}`)
  }
  res.redirect(req.query.url)
})*/

/*
* if route is not found, logs the error and returns custom 404
*/

app.use((req, res) => {
  
    Logs.create({
      userID: null,
      action: req.url,
      text: "page not found: " + req.url + " from ip:" + req.ip,
      level: 4
    });
  
  res.status(404).send("Sorry can't find that!")
})

/*
* if error is thrown, logs the error and returns custom 500
*/

// custom error handler
app.use((err, req, res, next) => {
  Logs.create({
    userID: null,
    action: req.url,
    text: "server error at: " + req.url + " from ip:" + req.ip + " error: " + err.stack,
    level: 5
  });
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

/*
* starts the server and listens to port
*/

app.listen(port, () => {
    console.log(`started server in port: ${port}`)
});

