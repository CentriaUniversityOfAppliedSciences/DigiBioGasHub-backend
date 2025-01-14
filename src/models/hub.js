import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Hub = sequelize.define('Hub',{
    
    name:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    origin:{
        type: DataTypes.STRING,
        allowNull: false
    }

});
export default Hub;