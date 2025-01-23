import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';


const Logs = sequelize.define('Logs',{
    userID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    action:{
        type: DataTypes.STRING,
        allowNull:false
    },
    text:{
        type: DataTypes.STRING(5000),
        allowNull:false
    },
    level:{
        type: DataTypes.INTEGER,
        allowNull: false
    }

});

export default Logs;