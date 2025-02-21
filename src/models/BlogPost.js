import { DataTypes } from 'sequelize';
import crypto from 'crypto';
import  sequelize  from './database.js';

const BlogPost = sequelize.define('BlogPost',{
    postID: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    title: {
        type:DataTypes.TEXT,
        allowNull:false
    },
    content:{
        type:DataTypes.TEXT,
        allowNull: false
    },
    image: {
        type:DataTypes.TEXT,
    },
    userID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    blogPostType:{
        type: DataTypes.SMALLINT,
    }
});

BlogPost.beforeValidate((post) => {
    post.postID = crypto.randomBytes(5).toString('hex'); // Generates a 10-char string
    console.log("Generated postID:", post.postID);
});

export default BlogPost;
