
/* 
* importing nodejs modules and starting express server
* uses morgan and helmet for logging and security
* sequelize is used for database connection
*/
import express from 'express';
var app = express();
var port = process.env.SERVER_PORT;
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
import { OFFER_UNITS, OFFER_CARGOTYPE, MATERIAL_TYPE} from './email/enum.js';
app.use(morgan('combined'));
app.use(helmet({

}));
app.disable('x-powered-by');
import sequelize from './models/database.js';
import { Op } from 'sequelize';
import minioconnector from './minioconnector.js';
import { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files } from './models/index.js';

sequelize.sync({ alter: false }).then(()=>{ // change alter:true if you want to update the database schema, fill in missing values in db manually, not for production
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
app.use(express.json({limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb' }));

/*
*  checking jwt token, if token is not present or invalid, returns 401
* /login, /register and /stations are allowed without token
*/

app.use(async (req, res, next) => {
  if (req.url == '/login' || req.url == '/register' || req.url == '/stations'){ 
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
* function to check if jwt token is valid, uses jwt.verify
*/
async function secTest(token){
  try{
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    return [true,decoded];
  }
  catch(error){
    return [false,null];
  }
}

/*
* function to check if user is admin, uses jwt.verify
*/

async function adminTest(token){
  try{
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (decoded.userlevel == 99){
      return [true,decoded];
    }
    else{
      return [false,decoded];
    }
  }
  catch(error){
    return [false,null];
  }
}

/*
* test route, TODO: remove
*/
app.get('/', (req, res) => {
    res.send('Hello World!')
});

/*
* test route, TODO: remove
*/
app.post('/secure', async (req,res)=>{
  
    res.json({ message: 'Protected route achieved' });
      
});

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
  try{
    const token = req.headers['authorization'];
    var [result,decoded] = await secTest(token);
    if (result == true && decoded.id == req.body.userID){
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
      }).then((company) => { 
        UserCompany.create({
          userID: body.userID,
          companyID: company.id,
          userlevel: 23,
          CompanyId: company.id
       }).then((usercompany) => {
        getCoords(body.address, body.zipcode, body.city).then((coords) => {
          if (coords != null && coords != undefined){
            Location.create({
              name: body.name,
              latitude: coords.data.lat,
              longitude: coords.data.lng,
              type: 1,
              companyID: company.id,
              parent: null
            });
          }
          
        });
        res.json({"type":"result","result":"ok","message":company});
        Logs.create({
          userID: decoded.id,
          action: req.url,
          text: "company create success, for company " + company.id + " from ip:" + req.ip,
          level: 1
        });
       });
      });
    }
    else{
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
    res.status(500).json({"type":"result","result":"fail","message": "cannot create company"});
    Logs.create({
      userID: null,
      action: req.url,
      text: "company create failed, for error " + error + " from ip:" + req.ip,
      level: 3
    });
  }
});

/*
* function to get coordinates from address, zipcode and city
* @param {string} address
* @param {string} zipcode
* @param {string} city

*/

function getCoords(address, zipcode, city){
  
  
	return new Promise(async (resolve, reject) => {
		try {
			axios.get('https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search', {
				params: {
					"text": address + " " + zipcode + " " + city,
					"sources": "interpolated-road-addresses",
					"lang": "fi",
					"api-key": process.env.MML_API_KEY
				}
			}).then(async (x) => {
				console.log(x);
				if (x.status == 200 && x.data != undefined && x.data.features != undefined && x.data.features.length > 0 && x.data.features[0].geometry != undefined) {
					const result = x.data.features[0].geometry.coordinates;//proj4("EPSG:3067", "EPSG:4326", x.data.features[0].geometry.coordinates);
					const obj = { lat: result[1], lng: result[0] };
					//res.send({ "data": x.data, "result": "ok" });
					resolve({ "data": obj, "result": "ok" });
				}
				else if (x.data == undefined || x.data.features == undefined || x.data.features.length == 0 || x.data.features[0].geometry == undefined) {
					try {
						axios.get('https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search', {
							params: {
								"text": address,
								"sources": "addresses",
								"lang": "fi",
								"api-key": process.env.MML_API_KEY
							}
						}).then(async (x) => {
							console.log(x);
							if (x.status == 200 && x.data != undefined && x.data.features != undefined && x.data.features.length > 0 && x.data.features[0].geometry != undefined) {
								const result = x.data.features[0].geometry.coordinates;//proj4("EPSG:3067", "EPSG:4326", x.data.features[0].geometry.coordinates);
								const obj = { lat: result[1], lng: result[0] };
								//res.send({ "data": x.data, "result": "ok" });
								resolve({ "data": obj, "result": "ok" });
							}
							else if (x.data == undefined || x.data.features == undefined || x.data.features.length == 0 || x.data.features[0].geometry == undefined) {

								console.log("Address not found for address: " + address);
								//res.send({ "data": "address not found" });
								resolve({ "data": "address not found", "result": "nfound" });
							}
							else {
								reject(x);
							}
						}).catch((e) => {
							reject(e);
						})
					}
					catch (e) {
						reject(e);
				  }
        }
				else {
					reject(x);
				}
			}).catch((e) => {
				reject(e);
			})
		}
		catch (e) {
			reject(e);
		}
	});
}

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
      const user = await User.findOne({
        where:{
          id: decoded.id
        },
      });
      user.getCompanies().then((companies) => {
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
        res.status(500).json({"type":"result","result":"fail","message": "cannot getusercompanies"});
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
* @route POST /admin/getallcompanies
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} companies
*/
app.post("/admin/getallcompanies", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        const companies = await Company.findAll();
        res.json({ "type": "result", "result": "ok", "message": companies });
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "access granted: " + req.url + " from ip:" + req.ip,
          level: 1
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get companies" });
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
      }
    } else {
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
      Logs.create({
        userID: null,
        action: req.url,
        text: "not authorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
    }
  });
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
* @route POST admin/updatecompanystatus
* @param {uuid} id
* @param {integer} status
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/

app.post("/admin/updatecompanystatus", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        const { id, status } = req.body;
    
        if (!id || status === undefined) {
          res.status(400).json({ result: "error", "message": "Company ID and status are required" });
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Company ID or status missing from ip:" + req.ip,
            level: 3
          });
        }
    
        const [updated] = await Company.update(
          { companyStatus: status },
          { where: { id } }
        );
    
        if (updated) {
          res.json({ "type": "result", "result": "ok", "message": "Company status updated successfully" });
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "company status updated: " + req.url + " from ip:" + req.ip,
            level: 1
          });
          
        } else {
          res.status(404).json({ result: "error", "message": "Company not found" });
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Company not found: " + req.url + " from ip:" + req.ip,
            level: 1
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "cannot update company status" });
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
      }
    }
    else{
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
    }
  });
  
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
    res.json({ type: "result", result: "ok", message: users });
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


/*
* @route POST /admin/getlimitedusers
* @param {integer} page
* @param {integer} limit
* @return {json}
  * @key type @value result
  * @key result @value {json} users
*/

app.post("/admin/getlimitedusers", async (req, res) => {
  try {
    let { page, limit } = req.body;
    const allowedLimits = [5, 25, 50, 75, 100];

    if (!allowedLimits.includes(limit)) {
      return res.status(400).json({
        type: "result",
        result: "fail",
        message: "Invalid limit. Allowed values are 5, 25, 50, 75, 100.",
      });
    }

    const users = await User.findAll({
      offset: page * limit,
      limit: limit,
      attributes: { exclude: ["password", "authMethod", "language"] },
    });

    const totalUsers = await User.count();

    res.json({ type: "result", result: "ok", message: users, total: totalUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: "result", result: "fail", message: "cannot get users" });
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


/* update user with admin rights */
/* @route POST /admin/updateuser
* @param {uuid} id
* @param {string} username
* @param {string} name
* @param {string} email
* @param {string} phone
* @param {integer} userlevel
* @param {integer} hubID
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value updated user
*/
app.post("/admin/updateuser", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]){
      try{
        var body = req.body;
        const user = await User.update({
          username: body.username,
          name: body.name,
          email: body.email,
          phone: body.phone,
          userlevel: body.userlevel,
          hubID: body.hubID
        },{
          where:{
            id: body.id
          }
        });
        res.json({"type":"result","result":"ok","message":user});
      }
      catch (error) {
        console.error(error);
        res.status(500).json({"type":"result","result":"fail","message": "cannot update user"});
      }
    }
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
  
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

            const folder = 'offers'; // Define the bucket/folder name
            const filename = `${offer.id}_${body.imageName}`; // Generate a unique filename

            // Upload the file to MinIO
            await minioconnector.insert(client, buffer, filename, folder);
                    
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
        if (body.address != null && body.address != undefined && body.city != null && body.city != undefined && body.zipcode != null && body.zipcode != undefined){
          const coords = await getCoords(body.address, body.zipcode, body.city);
          if (coords.data != null && coords.data != undefined){
            const location = await Location.create({
              name: offer.id,
              latitude: coords.data.lat,
              longitude: coords.data.lng,
              type: 2,
              companyID: body.companyID,
              parent: offer.id
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
        if (body.location != null && body.location != undefined && body.locationChanged == true){
          if (body.oldLocation == true){
            const location = await Location.update({
              name: body.id,
              latitude: body.location.lat,
              longitude: body.location.lng,
              type: 2,
              companyID: body.companyID,
              parent: body.id
            },{
              where:{
                id: body.locationID
              }
            });
          }
          else{
            const location = await Location.create({
              name: body.id,
              latitude: body.location.lat,
              longitude: body.location.lng,
              type: 2,
              companyID: body.companyID,
              parent: body.id
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
  try{
    const offers = await Offer.findAll({ 
      include: [Company, Material, Location, Files],
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
    }
    res.json({"type":"result","result":"ok", "message":offers});
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
    console.log("decoded",decoded);
    console.log("body",body);
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

      const buyerMsgHTML = buyerEmailTemplate({
        amount: body.amount,
        price: body.price,
        offer: offerData,
        material: materialData,
        isSoldOut,
        company
      });

      const sellerMsgHTML = sellerEmailTemplate({
        buyer,
        amount: body.amount,
        price: body.price,
        offer: offerData,
        material: materialData,
        company
      });

      sendEmail(buyer.email, "Purchase Confirmation", buyerMsgHTML, (success, error) => {
        if (!success) console.log("Buyer email error:", error);
      });
      
      sendEmail(company.email, "Your Offer Was Bought", sellerMsgHTML, (success, error) => {
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
* @route POST /admin/addmaterial
* @param {string} name
* @param {string} description
* @param {integer} type
* @param {string} quality
* @param {json} other
* @param {string} locality
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if "fail" {string} error message, if "ok" {json} material
*/
app.post("/admin/addmaterial", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if(result[0]){
      try{
        var body = req.body;
        const material = await Material.create({
          name: body.name,
          description: body.description,
          type: body.type,
          quality: body.quality,
          other: body.other,
          locality: body.locality
        });
        res.json({"type":"result","result":"ok","message":material});
      }
      catch (error) {
        console.error(error);
        res.status(500).json({"type":"result","result":"fail","message": "cannot create material"});
      }
    }
  });
  
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
* @route POST /admin/createblogpost
* @param {string} title
* @param {text} content
* @param {string} image (optional)
* @param {uuid} userID
* @param {integer} blogPostType
*/
app.post("/admin/createblogpost", async (req, res) => {
  try{
    var body = req.body;
    console.log(body);
    const blogpost = await BlogPost.create({
      title: body.title,
      content: body.content,
      image: body.image,
      userID: body.userID,
      blogPostType: body.blogPostType
    });
    res.json({"type":"result","result":"ok","message":blogpost});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "unable to  create blog post"});
  }
});


/*
* @route POST /admin/updateblogpost
* @param {uuid} postID
* @param {string} title
* @param {text} content 
* @param {string} image
* @param {integer} blogPostType
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} updated blog post
*/
app.post("/admin/updateblogpost", async (req, res) => {
  try {
    var body = req.body;
    const [numberOfAffectedRows, blogpost]  = await BlogPost.update({
      title: body.title,
      content: body.content,
      image: body.image,
      blogPostType: body.blogPostType
    }, {
      where: {
        postID: body.postID
      },
      returning: true
    });
    if (numberOfAffectedRows > 0) {
      res.json({ "type": "result", "result": "ok", "message": blogpost[0] });
    } else {
      res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "unable to update blog post"});
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
* @route POST /admin/getallblogposts
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} blog posts
*/
app.post("/admin/getallblogposts", async (req, res) => {
  try {
    const blogposts = await BlogPost.findAll();
    res.json({ "type": "result", "result": "ok", "message": blogposts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get blog posts" });
  }
}
);


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
        blogPostType: 1
      },
      limit: 4,
      order: [['createdAt', 'DESC']]
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
        blogPostType: 1
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
* @route POST /admin/publishblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
app.post("/admin/publishblogpost", async (req, res) => {
  try {
    var body = req.body;
    const [numberOfAffectedRows, blogpost] = await BlogPost.update({
      blogPostType: 1
    }, {
      where: {
        postID: body.postID
      },
      returning: true
    });
    if (numberOfAffectedRows > 0) {
      res.json({ "type": "result", "result": "ok" });
    } else {
      res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to change blog post status" });
  }
}
);


/*
* @route POST /admin/unpublishblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
app.post("/admin/unpublishblogpost", async (req, res) => {
  try {
    var body = req.body;
    const [numberOfAffectedRows, blogpost] = await BlogPost.update({
      blogPostType: 0
    }, {
      where: {
        postID: body.postID
      },
      returning: true
    });
    if (numberOfAffectedRows > 0) {
      res.json({ "type": "result", "result": "ok" });
    } else {
      res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to change blog post status" });
  }
}
);


/*
* @route POST /admin/deleteblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
app.post("/admin/deleteblogpost", async (req, res) => {
  try {
    var body = req.body;
    const numberOfDeletedRows = await BlogPost.destroy({
      where: {
        postID: body.postID
      }
    });
    if (numberOfDeletedRows > 0) {
      res.json({ "type": "result", "result": "ok" });
    } else {
      res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ "type": "result", "result": "fail", "message": "unable to delete blog post" });
  }
}
);

/*
* @route POST /admin/getmaterials
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} materials
*/

app.post("/admin/getmaterials", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        const materials = await Material.findAll();
        res.json({ "type": "result", "result": "ok", "message": materials });
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get materials" });
      }
    }
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
  
});

/*
* @route POST /admin/editmaterial
* @param {uuid} id
* @param {string} name
* @param {string} description
* @param {integer} type
* @param {string} quality
* @param {json} other
* @param {string} locality
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} material
*/

app.post("/admin/editmaterial", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        var body = req.body;
        const material = await Material.update({
          name: body.name,
          description: body.description,
          type: body.type,
          quality: body.quality,
          other: body.other,
          locality: body.locality
        }, {
          where: {
            id: body.id
          }
        });
        res.json({ "type": "result", "result": "ok", "message": material });
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to update material" });
      }
    }
  });
});

/*
* @route POST /admin/deletematerial
* @param {uuid} id
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} material
*/
app.post("/admin/deletematerial", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        var body = req.body;
        const material = await Material.destroy({
          where: {
            id: body.id
          }
        });
        res.json({ "type": "result", "result": "ok", "message": material });
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to delete material" });
      }
    }
  });
});

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
  var body = req.body;
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const invitation = await Invitation.create({
      email: body.email,
      companyID: body.companyID,
      expiryDate: expiryDate,
      status: "pending",
      invitedById: body.invitedById,
      invitedByName: body.invitedByName
    });

    const invitationLink = `http://192.168.56.101:8100/join-company/${invitation.id}`;

    const emailContent = invitationEmailTemplate(body.invitedByName, body.companyName, invitationLink, expiryDate);

    sendEmail(body.email, "Company Invitation", emailContent, (success, error) => {
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
* @param {uuid} invitationId
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {string} success message
*/
app.post("/invitations/validate", async (req, res) => {
  const { invitationId } = req.body;

  try {

    const invitation = await Invitation.findOne({
      where: { id: invitationId },
    });

    console.log("Validating invitation:", invitationId);
    console.log("Invitation details:", invitation);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    const currentDate = new Date();
    if (new Date(invitation.expiryDate) < currentDate) {
      return res.status(400).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    res.json({
      success: true,
      message: "Invitation is valid",
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    res.status(500).json({
      success: false,
      message: "Unable to validate invitation",
    });
  }
});


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

