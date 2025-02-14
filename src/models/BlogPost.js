import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';

const BlogPost = sequelize.define('BlogPost',{

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
export default BlogPost;