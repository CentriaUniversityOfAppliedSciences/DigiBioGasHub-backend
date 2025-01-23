import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Company = sequelize.define('Company',{
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey:true
    },
    name: {
        type:DataTypes.TEXT,
        allowNull:false
    },
    address:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    city:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    zipcode:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    contact:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone:{
        type: DataTypes.STRING,
    },
    companyType:{
        type: DataTypes.SMALLINT,
    },hubID:{
        type: DataTypes.INTEGER
    }
});

export default Company;