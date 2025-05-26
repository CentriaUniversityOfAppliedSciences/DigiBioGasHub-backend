import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Contract = sequelize.define('Contract',{
    offerID:{
        type:DataTypes.UUID,
        allowNull:false
    },
    buyer:{
        type:DataTypes.UUID,
        allowNull:false
    },
    price:{
        type:DataTypes.DECIMAL,
        allowNull:false
    },
    amount:{
        type:DataTypes.DECIMAL,
        allowNull:false
    },
    unit:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    timestamp:{
        type:DataTypes.DATE,
        defaultValue:DataTypes.NOW
    },
    companyID:{
        type:DataTypes.UUID,
        allowNull:false
    },
    status:{
        type:DataTypes.ENUM('pending', 'completed', 'cancelled'),
        defaultValue:'pending'
    }
});

export default Contract;