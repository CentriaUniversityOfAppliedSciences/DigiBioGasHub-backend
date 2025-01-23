import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Offer = sequelize.define('Offer',{
    type:{
        type: DataTypes.INTEGER
    },
    materialID:{
        type: DataTypes.INTEGER
    },
    companyID: {
        type: DataTypes.UUID
    },
    locationID:{
        type: DataTypes.INTEGER
    },
    unit:{
        type:DataTypes.INTEGER
    },
    price:{
        type:DataTypes.DECIMAL
    },
    amount:{
        type:DataTypes.DECIMAL
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
    }
    
});
export default Offer;