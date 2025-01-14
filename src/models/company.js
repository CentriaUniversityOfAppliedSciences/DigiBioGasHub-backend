import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Company = sequelize.define('Company',{
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
    }
});

export default Company;