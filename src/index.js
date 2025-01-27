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
import {createConnection,getHub,closeConnection} from './pgconnector.js';
app.use(morgan('combined'));
app.use(helmet({

}));
app.disable('x-powered-by');
import sequelize from './models/database.js';
import { User, Company, Hub, Location, Logs } from './models/index.js';
sequelize.sync({ force: false }).then(()=>{
  //console.log("created");
}).catch((e)=>{
  console.log(e);
});

var corsOptionsDelegate = async function (req,callback) {
  var corsOptions;
  //origin: async function (origin, callback) {
    // db.loadOrigins is an example call to load
    // a list of origins from a backing database
    var origin = req.header('Origin');

    const hub = await Hub.findOne({ 
      where: { origin: origin }
    });
    //var client = await createConnection();
    //var o = await getHub(client,origin);
    //await closeConnection(client);
    if (hub != null && hub.dataValues != null && hub.dataValues.type == 1){
      console.log("origin is ok");
      corsOptions = { origin: true }
    }
    else{
      confirm.log("origin is not ok");
      corsOptions = { origin: false }
    }
    callback(null, corsOptions);
    
  //}
}

app.use(async (req, res, next) => {
  if (req.url == '/login' || req.url == '/register', req.url == '/stations') {
    next();
  }
  else{
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ "type":"result","result":"fail","message": 'error' });
    }
    try {
        if (await secTest(token)){
          console.log("going to next");
          next();
        }
        else{
          console.log("error1");
          return res.status(401).json({ "type":"result","result":"fail","message": 'error' });
        }
    } catch (error) {
      console.log("error2"); 
      console.log(error);
        res.status(401).json({ "type":"result","result":"fail","message": 'error' });
    }
  }
})


async function secTest(token){
  try{
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    return true;
  }
  catch(error){
    return false;
  }
}
app.use(cors(corsOptionsDelegate));
app.use(express.json());
app.use(bodyParser.json());





app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/secure', async (req,res)=>{
  
    res.json({ message: 'Protected route achieved' });
      
});


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

app.post("/register", async (req, res) => {
  try{
    var body = req.body;
    const pass = await cryptic.hash(req.body.password);
    const user = await User.create({
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








//these must be at the bottom but before listen !!!!

app.use((req, res) => {
  try {
    if (new Url(req.query.url).host !== 'net.centria.fi') {
      return res.status(400).end(`Unsupported redirect to host: ${req.query.url}`)
    }
  } catch (e) {
    return res.status(400).end(`Invalid url: ${req.query.url}`)
  }
  res.redirect(req.query.url)
})

app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!")
})

// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(port, () => {
    console.log(`started server in port: ${port}`)
});

