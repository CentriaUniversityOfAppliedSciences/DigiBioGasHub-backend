
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
app.use(morgan('combined'));
app.use(helmet({

}));
app.disable('x-powered-by');
import sequelize from './models/database.js';
import { Op } from 'sequelize';
import { User, Hub, Company, Location, UserCompany, Logs, Contract, Offer, Material, Bids, BlogPost } from './models/index.js';

sequelize.sync({ force: false }).then(()=>{
  //console.log("created");
}).catch((e)=>{
  console.log(e);
});

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
app.use(express.json());
app.use(bodyParser.json());

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
            text: "jwt check, page access granted:" + req.url + " for user:" + decoded.username + " from ip:" + req.ip,
            level: 1
          });
          next();
        }
        else{
          if (decoded != null&& decoded != undefined && decoded.id != null && decoded.id != undefined){
            await Logs.create({
              userID: decoded.id,
              action: req.url,
              text: "jwt check, page access failed, invalid jwt token for: " + req.url + " for user:" + decoded.username + " from ip:" + req.ip,
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
          text: "jwt check, page access failed, for page " + req.url +  " error: " + error + " for user:" + decoded.username + " from ip:" + req.ip,
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
    }
    else{
      res.json({
        "type":"result",
        "result":"fail"
      });
    }
  }
  
  else{
    res.json({
      "type":"result",
      "result":"fail"
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
    var body = req.body;
    const company = await Company.create({
      name: body.name,
      address: body.address,
      city: body.city,
      zipcode: body.zipcode,
      email: body.email,
      phone: body.phone,
      companyType: body.companyType,
      hubID: "1",
      web: body.web
    }).then((company) => { 
      UserCompany.create({
        userID: body.userID,
        companyID: company.id,
        userlevel: 23,
        CompanyId: company.id
     });
    });
    
    res.json({"type":"result","result":"ok","message":company});
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot create company"});
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
    const user = await User.findOne({
      where:{
        id: decoded.id
      },
    });
    user.getCompanies().then((companies) => {
      res.json({"type":"result","result":"ok", "message":companies});
    }).
    catch((error) => {
      console.error(error);
      res.status(500).json({"type":"result","result":"fail","message": "cannot getusercompanies"});
       
    });
    
  }
  catch (error) { 
    console.error(error); 
    res.status(500).json({"type":"result","result":"fail","message": "cannot getusercompanies"});
  }
})

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
    var body = req.body;
    const company = await Company.update({
      name: body.name,
      address: body.address,
      city: body.city,
      zipcode: body.zipcode,
      email: body.email,
      phone: body.phone,
      companyType: body.companyType,
      web: body.web
    },{
      where:{
        id: body.id
      }
    });
    res.json({"type":"result","result":"ok","message":company});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot update company"});
  }
});

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
  try{
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({"type":"result","result":"ok","message":users});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get users"});
  }
}
);


app.post("/updateuser", async (req, res) => {
  try{
    var body = req.body;
    const user = await User.update({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
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
});
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
app.delete("/deletecompany", async (req, res) => {
  try{
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
      include: [Company, Material, Location],
      where:{
        visibility: 1,
        status: 1,
        endDate: {
          [Op.gte]: new Date()
        },
        startDate: {
          [Op.lte]: new Date()
        }
      }
    });
    res.json({"type":"result","result":"ok", "message":offers});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({"type":"result","result":"fail","message": "cannot get offers"});
  }
});

/*
* @route POST /creatematerial
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
app.post("/creatematerial", async (req, res) => {
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
});

/* 
* @route POST /getmaterials
* @return {json}
  * @key type @value result
  * @key result @value {json} materials
*/

app.post("/getmaterials", async (req, res) => {
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
    const offers = await Offer.findOne({
      where:{
        id: body.id
      }
    });
    res.json({"type":"result","result":"ok", "message":offers});
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
* @route POST /createblogpost
* @param {string} title
* @param {text} content
* @param {string} image (optional)
* @param {uuid} userID
* @param {integer} blogPostType
*/
app.post("/createblogpost", async (req, res) => {
  try{
    var body = req.body;
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
* @route POST /updateblogpost
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
app.post("/updateblogpost", async (req, res) => {
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
* @route POST /getallblogposts
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} blog posts
*/
app.post("/getallblogposts", async (req, res) => {
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
* @route POST /publishblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
app.post("/publishblogpost", async (req, res) => {
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
* @route POST /unpublishblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
app.post("/unpublishblogpost", async (req, res) => {
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
* @route POST /deleteblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
app.post("/deleteblogpost", async (req, res) => {
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

