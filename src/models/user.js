import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const User = sequelize.define('User',{
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password:{
        type: DataTypes.STRING(1000),
        allowNull: false,
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    authMethod:{
        type: DataTypes.STRING,
    },
    userlevel:{
        type: DataTypes.SMALLINT
    },
    hubID:{
        type: DataTypes.BIGINT
    }
});
export default User;