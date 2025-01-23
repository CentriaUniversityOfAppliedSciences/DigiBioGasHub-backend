import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const UserCompany = sequelize.define('UserCompany',{
    
    userID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    companyID:{
        type: DataTypes.UUID,
        allowNull: false,
    },
    userlevel:{
        type: DataTypes.BIGINT,
        allowNull: false,
    }
});
export default UserCompany;