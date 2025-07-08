import { DataTypes } from 'sequelize';

import sequelize from './database.js';


const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
    },
    username: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(1000),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    authMethod: {
        type: DataTypes.STRING,
    },
    userlevel: {
        type: DataTypes.SMALLINT
    },
    isPremiumUser: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hubID: {
        type: DataTypes.BIGINT
    },
    language: {
        type: DataTypes.STRING
    }
});

export default User;
