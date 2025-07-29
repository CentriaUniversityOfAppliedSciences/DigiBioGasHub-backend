import express from 'express';
import { Op } from 'sequelize';
import { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics, Certificates, CompanyCertificates} from '../models/index.js';
import jwt from 'jsonwebtoken';
import { adminTest } from '../functions/utils.js'; 
const router = express.Router();
import minioconnector from '../minioconnector.js';
import sequelize from '../models/database.js';
import multer from 'multer';
const upload = multer();


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
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "user updated: " + body.id + " from ip:" + req.ip,
          level: 1
        });
        res.json({"type":"result","result":"ok","message":user});
      }
      catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        
        res.status(500).json({"type":"result","result":"fail","message": "cannot update user"});
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
      Logs.create({
        userID: null,
        action: req.url,
        text: "invalid limit: " + limit + " from ip:" + req.ip, 
        level: 2
      });
      return res.status(400).json({
        type: "result",
        result: "fail",
        message: "Invalid limit. Allowed values are 5, 25, 50, 75, 100.",
      });
    }

    const users = await User.findAll({
      include: [{ 
        model: Subscription, 
        where :{ 
          status: "active", 
          expirationDate: { [Op.eq]: sequelize.literal(`(
            SELECT MAX("expirationDate")
            FROM "Subscriptions"
            WHERE "Subscriptions"."userID" = "User"."id"
              AND "Subscriptions"."status" = 'active'
            )`) 
          } 
        },
        required: false 
      }],
      offset: page * limit,
      limit: limit,
      attributes: { exclude: ["password", "authMethod", "language"] },
    });

    const totalUsers = await User.count();
    Logs.create({
      userID: null,
      action: req.url,
      text: "access granted: " + req.url + " from ip:" + req.ip,
      level: 1
    });
    res.json({ type: "result", result: "ok", message: users, total: totalUsers });
  } catch (error) {
    console.error(error);
    Logs.create({
      userID: null,
      action: req.url,
      text: "error: " + error + " from ip:" + req.ip,
      level: 3
    });
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
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Company ID or status missing from ip:" + req.ip,
            level: 3
          });
          return res.status(400).json({ result: "error", "message": "Company ID and status are required" });
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
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        var body = req.body;
        const id = body.id;
        if (!id) {
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Company ID is required from ip:" + req.ip,
            level: 3
          });
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
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "company deleted: " + body.id + " from ip:" + req.ip,
          level: 1
        });
        res.json({ type: "result", result: "ok", message: company });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
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
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "material created: " + material.id + " from ip:" + req.ip,
          level: 1
        });
        res.json({"type":"result","result":"ok","message":material});
      }
      catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
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
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "access granted: " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": materials });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get materials" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "material updated: " + body.id + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": material });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
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
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "material deleted: " + body.id + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": material });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
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
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post published: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.json({ "type": "result", "result": "ok" });
        } else {
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post not found: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
        }
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to change blog post status" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post unpublished: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.json({ "type": "result", "result": "ok" });
        } else {
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post not found: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
        }
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to change blog post status" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post deleted: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.json({ "type": "result", "result": "ok" });
        } else {
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post not found: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
        }
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to delete blog post" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
        const blogposts = await BlogPost.findAll(
          {
            attributes: { exclude: ['content'] }
          }
        );
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "access granted: " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": blogposts });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get blog posts" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
        const blogpost = await BlogPost.create({
          title: body.title,
          content: body.content,
          image: body.image,
          userID: body.userID,
          blogPostType: body.blogPostType
        });
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "Blog post created: " + blogpost.postID + " from ip:" + req.ip,
          level: 1
        });
        res.json({"type":"result","result":"ok","message":blogpost});
      }
      catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({"type":"result","result":"fail","message": "unable to  create blog post"});
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/*
* @route POST /admin/createblogpostfile
* @param {string} title
* @param {text} content
* @param {string} image (optional)
* @param {uuid} userID
* @param {integer} blogPostType
*/
router.post("/createblogpostfile", upload.single('file'), async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try{
        var body = req.body;
        var file = req.file;
        const blogpost = await BlogPost.create({
          title: body.title,
          content: "",
          image: body.image,
          userID: result[1].id,
          blogPostType: 3
        });
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "Blog post file created: " + blogpost.postID + " from ip:" + req.ip,
          level: 1
        });
        if (file != null && file != undefined) {
          const client = await minioconnector.createConnection();
          const folder = "blogposts";
          const filename = blogpost.postID + ".pdf";
          const buffer = Buffer.from(file.buffer);
          await minioconnector.insert(client, buffer, filename, folder);
          minioconnector.closeConnection(client);
          const bb = await BlogPost.update({
            content: folder + "/" + filename
          }, {
            where: {
              postID: blogpost.postID
            }
          });
        }
        res.json({"type":"result","result":"ok","message":blogpost});
      }
      catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({"type":"result","result":"fail","message": "unable to  create blog post"});
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post updated: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.json({ "type": "result", "result": "ok", "message": blogpost[0] });
        } else {
          Logs.create({
            userID: result[1].id,
            action: req.url,
            text: "Blog post not found: " + body.postID + " from ip:" + req.ip,
            level: 1
          });
          res.status(404).json({ "type": "result", "result": "fail", "message": "Blog post not found" });
        }
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({"type":"result","result":"fail","message": "unable to update blog post"});
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/*
* @route POST /admin/getcertificates
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} certificates
*/
router.post("/getcertificates", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        const certificates = await Certificates.findAll({});
        const client = await minioconnector.createConnection();
        
            // Add temporary file links to each certificate
        for (const certificate of certificates) {
          if (certificate.dataValues.file != null) {
            const filePath = certificate.dataValues.file; 
            const [folder, filename] = filePath.split('/'); // Split into folder and filename
            const tempLink = await minioconnector.getLink(client, folder, filename);
            certificate.dataValues.fileLink = tempLink; // Add the temporary link to the offer
          }
        }
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "access granted: " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": certificates });
      } 
      catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get certificates" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/*
* @route POST /admin/getcompanycertificates
* @param {uuid} companyID (optional - if not provided, all company certificates will be returned)
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} company certificates
*/
router.post("/getcompanycertificates", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        
        const companyCertificates = await CompanyCertificates.findAll({
          include:[Company]
        });
        for (const certificate of companyCertificates) {
          if (certificate.dataValues.file != null) {
            const filePath = certificate.dataValues.file; 
            const [folder, filename] = filePath.split('/'); // Split into folder and filename
            const tempLink = await minioconnector.getLink(client, folder, filename);
            certificate.dataValues.fileLink = tempLink; // Add the temporary link to the offer
          }
        }
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "access granted: " + req.url + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": companyCertificates });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to get company certificates" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip, 
        level: 2
      });
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/*
* @route POST /admin/addcertificate
* @param {string} type
* @param {string} name
* @param {string} file
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} certificate
*/
router.post("/addcertificate", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) { 
      try {
        var body = req.body;
        
        const certificate = await Certificates.create({
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
            await Certificates.update({
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
          userID: result[1].id,
          action: req.url,
          text: "certificate created: " + certificate.id + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": certificate });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to create certificate" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/** @route POST /admin/removecertificate
* @param {uuid} id  
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} deleted certificate
*/
router.post("/removecertificate", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        var body = req.body;
        const certificate = await Certificates.destroy({
          where: {
            id: body.certificateID
          }
        });
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "certificate deleted: " + body.certificateID + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": certificate });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to delete certificate" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      return res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/* @route POST /admin/editcertificate
* @param {uuid} id
* @param {string} type
* @param {string} name
* @param {string} description
* @param {string} file (optional)
* @return {json}
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} updated certificate
*/
router.post("/editcertificate", async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {  
      try {
        var body = req.body;
        const certificate = await Certificates.update({
          type: body.type,
          name: body.name,
          description: body.description
        }, {
          where: {
            id: body.certificateID
          },
          returning: true
        });
        
        if (body.file64 != null && body.file64 != undefined && body.file64 != "") {
          const client = await minioconnector.createConnection();
          try {
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
            const filename = `${body.id}${fileExt}`; // Generate a unique filename
            
            // Upload the file to MinIO
            await minioconnector.insert(client, buffer, filename, folder);
            await Certificates.update({
              file: `${folder}/${filename}`
            }, {
              where: {
                id: body.id
              }
            });
          } catch (error) {
            console.error("Error uploading file to MinIO:", error);
          }
        }
        
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "certificate updated: " + body.certificateID + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": certificate[1][0] });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to update certificate" });
      }
    }
    else{
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized: " + req.url + " from ip:" + req.ip,
        level: 2
      });
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
          return res.status(400).json({ "type": "result", "result": "fail", "message": "Missing required fields" });
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
          await User.update({ userlevel: 2, isPremiumUser: true }, { where: { id: userID } });
        }

        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "Subscription gifted to user: " + userID + " from ip:" + req.ip,
          level: 1
        });

        res.json({ "type": "result", "result": "ok", "message": subscription });
      } catch (error) {
        console.error(error);

        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to register subscription" });
      }
    }
    else {
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized access: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

/*
* @route POST /admin/cancelsubscription
* @param {uuid} userID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
  * @key message @value if fail {string} error message, if ok {json} subscription details
*/
router.post('/cancelusersubscription', async (req, res) => {
  adminTest(req.headers['authorization']).then(async (result) => {
    if (result[0]) {
      try {
        const { userID } = req.body;

        if (!userID) {
          return res.status(400).json({ "type": "result", "result": "fail", "message": "Missing userID" });
        }

        await Subscription.update(
          { status: 'cancelled' },
          {
            where: {
              userID,
              expirationDate: {
                [Op.gt]: new Date()
              },
              status: 'active'
            }
          }
        );

        await User.update({ isPremiumUser: false }, { where: { id: userID } });
        
        Logs.create({
          userID: result[1].id,
          action: req.url,
          text: "Subscription cancelled for user: " + userID + " from ip:" + req.ip,
          level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": "Subscription cancelled successfully" });
      } catch (error) {
        console.error(error);
        Logs.create({
          userID: null,
          action: req.url,
          text: "error: " + error + " from ip:" + req.ip,
          level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "Unable to cancel subscription" });
      }
    }
    else {
      Logs.create({
        userID: null,
        action: req.url,
        text: "unauthorized access: " + req.url + " from ip:" + req.ip,
        level: 2
      });
      res.status(401).json({ "type": "result", "result": "fail", "message": "unauthorized access" });
    }
  });
});

export default router;
