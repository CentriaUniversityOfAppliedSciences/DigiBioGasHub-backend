import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Subscription = sequelize.define('Subscription',{
    userID:{
        type:DataTypes.UUID,
        allowNull:false
    },
    subscriptionDate:{
        type:DataTypes.DATE,
        allowNull:false
    },
    expirationDate:{
        type:DataTypes.DATE,
        allowNull:false
    },
    status:{
        type:DataTypes.STRING,
        allowNull:false
    }
    
});
export default Subscription;