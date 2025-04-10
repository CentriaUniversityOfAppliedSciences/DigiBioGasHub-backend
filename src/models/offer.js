import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Offer = sequelize.define('Offer',{
    id:{
        type: DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        primaryKey:true,
        allowNull: false,
        unique: true,
    },
    type:{
        type: DataTypes.INTEGER
    },
    materialID:{
        type: DataTypes.UUID,
        allowNull: false
    },
    companyID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    locationID:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unit:{
        type:DataTypes.INTEGER,
        allowNull: false
    },
    price:{
        type:DataTypes.DECIMAL,
        allowNull: false
    },
    amount:{
        type:DataTypes.DECIMAL,
        allowNull: false
    },
    startDate:{
        type:DataTypes.DATE
    },
    endDate:{
        type:DataTypes.DATE
    },
    availableAmount:{
        type: DataTypes.DECIMAL
    },
    creator:{
        type:DataTypes.UUID
    },
    status:{
        type: DataTypes.INTEGER
    },
    sold:{
        type: DataTypes.DATE
    },
    cargoType:{
        type:DataTypes.INTEGER
    },
    visibility:{
        type: DataTypes.INTEGER
    },
    description:{
        type: DataTypes.TEXT
    }
    
});
export default Offer;