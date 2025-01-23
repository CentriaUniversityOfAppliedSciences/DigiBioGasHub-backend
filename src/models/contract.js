import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Contract = sequelize.define('Contract',{
    offerID:{
        type:DataTypes.INTEGER,
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
    timestamp:{
        type:DataTypes.DATE,
        defaultValue:DataTypes.NOW
    }
});

export default Contract;