import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Material = sequelize.define('Material',{
    name:{
        type:DataTypes.TEXT
    },
    description:{
        type:DataTypes.TEXT
    },
    type:{
        type:DataTypes.INTEGER
    },
    quality:{
        type:DataTypes.TEXT
    },
    other:{
        type: DataTypes.JSON
    },
    locality:{
        type:DataTypes.INTEGER
    }
    
});
export default Material;