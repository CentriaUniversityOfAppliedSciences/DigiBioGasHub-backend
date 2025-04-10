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
    parent:{
        type: DataTypes.UUID,
    },
    companyID:{
        type: DataTypes.UUID,
        allowNull: false,
    }
});
export default Location;