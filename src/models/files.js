import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Files = sequelize.define('Files',{
    id:{
        type: DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        primaryKey:true,
        allowNull: false,
        unique: true,
    },
    name:{
        type:DataTypes.TEXT
    },
    type:{
        type:DataTypes.INTEGER
    },
    parent:{
        type:DataTypes.UUID
    },
    data:{
        type:DataTypes.TEXT
    }
    
});
export default Files;