import express from 'express';
import { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics} from '../models/index.js';
import jwt from 'jsonwebtoken';
import { adminTest } from '../functions/utils.js'; 
const router = express.Router();



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
router.post("/updateuser", async (req, res) => {
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
* @route POST /admin/getlimitedusers
* @param {integer} page
* @param {integer} limit
* @return {json}
  * @key type @value result
  * @key result @value {json} users
*/

router.post("/getlimitedusers", async (req, res) => {
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


/*
* @route POST admin/updatecompanystatus
* @param {uuid} id
* @param {integer} status
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/

router.post("/updatecompanystatus", async (req, res) => {
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
* @route POST /admin/getallcompanies
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} companies
*/
router.post("/getallcompanies", async (req, res) => {
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
* @route POST /admin/deletecompany
* @param {uuid} id
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} company
*/
router.post("/deletecompany", async (req, res) => {
  console.log("request body:", req.body);
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        var body = req.body;
        const id = body.id;
        if (!id) {
          return res.status(400).json({ type: "result", result: "fail", message: "Company ID is required" });
        }

        await Offer.destroy({ where: { companyID: id } });

        const company = await Company.destroy({ where: { id } }).then(() => {
          UserCompany.destroy({
            where: {
              companyID: body.id
            }
          });
        });

        res.json({ type: "result", result: "ok", message: company });
      } catch (error) {
        console.error(error);
        res.status(500).json({ type: "result", result: "fail", message: "unable to delete company" });
      }
    }
  });
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
router.post("/addmaterial", async (req, res) => {
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
* @route POST /admin/getmaterials
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} materials
*/

router.post("/getmaterials", async (req, res) => {
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

router.post("/editmaterial", async (req, res) => {
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
router.post("/deletematerial", async (req, res) => {
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
* @route POST /admin/publishblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
router.post("/publishblogpost", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
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
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});


/*
* @route POST /admin/unpublishblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
router.post("/unpublishblogpost", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
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
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});


/*
* @route POST /admin/deleteblogpost
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
router.post("/deleteblogpost", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
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
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});


/*
* @route POST /admin/getallblogposts
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} blog posts
*/
router.post("/getallblogposts", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        const blogposts = await BlogPost.findAll();
        res.json({ "type": "result", "result": "ok", "message": blogposts });
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get blog posts" });
      }
    }
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});


/*
* @route POST /admin/createblogpost
* @param {string} title
* @param {text} content
* @param {string} image (optional)
* @param {uuid} userID
* @param {integer} blogPostType
*/
router.post("/createblogpost", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
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
    }
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
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
router.post("/updateblogpost", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
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
    }
    else{
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});


/*
* @route POST /admin/giftsubscription
* @param {uuid} userID
* @param {date} subscriptionDate
* @param {date} expirationDate
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} subscription details
*/
router.post('/giftsubscription', async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        let { userID, subscriptionDate, expirationDate } = req.body;

        if (!userID || !subscriptionDate || !expirationDate) {
          return res.status(400).json({ type: "result", result: "fail", message: "Missing required fields" });
        }
  
        subscriptionDate = new Date(subscriptionDate);
        expirationDate = new Date(expirationDate);

        const latestSub = await Subscription.findOne({
          where: { userID },
          order: [['expirationDate', 'DESC']]
        });

        if (latestSub && new Date(latestSub.expirationDate) > subscriptionDate) {

          const durationMs = expirationDate - subscriptionDate;
          subscriptionDate = new Date(latestSub.expirationDate);
          expirationDate = new Date(subscriptionDate.getTime() + durationMs);
        }

        const subscription = await Subscription.create({
          userID,
          subscriptionDate,
          expirationDate,
          status: "active",
        });

        if (subscription) {
          await User.update({ isPremiumUser: true }, { where: { id: userID } });
        }

        res.json({ "type": "result", "result": "ok", "message": subscription });
      } catch (error) {
        console.error(error);
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to register subscription" });
      }
    }
    else {
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

export default router;
