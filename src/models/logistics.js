import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';

const Logistics = sequelize.define('Logistics', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    companyID: {
        type: DataTypes.UUID,
        allowNull: false,
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
    latitude:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    longitude:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    haulType: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
    visibility:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // 1 for public, 0 for private
    }
});

export default Logistics;
