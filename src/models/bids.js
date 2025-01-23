import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Bids = sequelize.define('Bids',{
    offerID:{
        type:DataTypes.INTEGER,
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
    userID:{
        type: DataTypes.UUID,
        allowNull:false
    },
    companyID:{
        type:DataTypes.UUID,
        allowNull:false
    }
    
});
export default Bids;