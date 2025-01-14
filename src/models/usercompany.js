import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const UserCompany = sequelize.define('UserCompany',{
    
    userID: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    companyID:{
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    created:{
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    updated:{
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    userlevel:{
        type: DataTypes.BIGINT,
        allowNull: false,
    }
});
export default UserCompany;