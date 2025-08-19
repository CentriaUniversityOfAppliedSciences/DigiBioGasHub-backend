import express from 'express';
import { Logs, BlogPost } from '../models/index.js';
const router = express.Router();
import { secTest } from '../functions/utils.js';

/*
* @route POST /blog/sendforreview
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
router.post("/sendforreview", async (req, res) => {

    const token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

    try {
        var body = req.body;
        const [numberOfAffectedRows, blogpost] = await BlogPost.update({
            blogPostType: 0
        }, {
            where: {
                postID: body.postID,
                userID: decoded.id
            },
            returning: true
        });
        if (numberOfAffectedRows > 0) {
            Logs.create({
                userID: decoded.id,
                action: req.url,
                text: "Blog post unpublished: " + body.postID + " from ip:" + req.ip,
                level: 1
            });
            res.json({ "type": "result", "result": "ok" });
        } else {
            Logs.create({
                userID: decoded.id,
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
});

/*
* @route POST /blog/createblogpost
* @param {string} title
* @param {text} content
* @param {string} image (optional)
* @param {uuid} userID
* @param {integer} blogPostType
*/
router.post("/createblogpost", async (req, res) => {

    const token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

    try {
        var body = req.body;
        const blogpost = await BlogPost.create({
            title: body.title,
            content: body.content,
            image: body.image,
            userID: decoded.id,
            blogPostType: 2
        });
        Logs.create({
            userID: decoded.id,
            action: req.url,
            text: "Blog post created: " + blogpost.postID + " from ip:" + req.ip,
            level: 1
        });
        res.json({ "type": "result", "result": "ok", "message": blogpost });
    }
    catch (error) {
        console.error(error);
        Logs.create({
            userID: null,
            action: req.url,
            text: "error: " + error + " from ip:" + req.ip,
            level: 3
        });
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to  create blog post" });
    }
});

/*
* @route POST /blog/updateblogpost
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

    const token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

    try {
        var body = req.body;
        const [numberOfAffectedRows, blogpost] = await BlogPost.update({
            title: body.title,
            content: body.content,
            image: body.image,
            blogPostType: 2
        }, {
            where: {
                postID: body.postID,
                userID: decoded.id
            },
            returning: true
        });
        if (numberOfAffectedRows > 0) {
            Logs.create({
                userID: decoded.id,
                action: req.url,
                text: "Blog post updated: " + body.postID + " from ip:" + req.ip,
                level: 1
            });
            res.json({ "type": "result", "result": "ok", "message": blogpost[0] });
        } else {
            Logs.create({
                userID: decoded.id,
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
        res.status(500).json({ "type": "result", "result": "fail", "message": "unable to update blog post" });
    }
});

/*
* @route POST /blog/unpublishreq
* @param {uuid} postID
* @return {json} 
  * @key type @value result
  * @key result @value ["ok", "fail"]
*/
router.post("/unpublishreq", async (req, res) => {

    const token = req.headers['authorization'];
    var [result, decoded] = await secTest(token);

    if (!result) {
        return res.status(401).json({ "type": "result", "result": "fail", "message": "Unauthorized access" });
    }

    try {
        var body = req.body;
        const [numberOfAffectedRows, blogpost] = await BlogPost.update({
            blogPostType: 2
        }, {
            where: {
                postID: body.postID,
                userID: decoded.id
            },
            returning: true
        });
        if (numberOfAffectedRows > 0) {
            Logs.create({
                userID: decoded.id,
                action: req.url,
                text: "Blog post unpublished: " + body.postID + " from ip:" + req.ip,
                level: 1
            });
            res.json({ "type": "result", "result": "ok" });
        } else {
            Logs.create({
                userID: decoded.id,
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
});



export default router;

