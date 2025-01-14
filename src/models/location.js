import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Location = sequelize.define('Location',{
    
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    longitude:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    type:{
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    companyID:{
        type: DataTypes.BIGINT,
        allowNull: false,
    }
});
export default Location;