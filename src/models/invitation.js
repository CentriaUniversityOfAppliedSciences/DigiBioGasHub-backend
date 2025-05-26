import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';

const Invitation = sequelize.define('Invitation', {
    id:{
        type: DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        primaryKey:true,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    companyID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING, 
        allowNull: false,
        defaultValue: 'pending',
    },
    invitedBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
});

export default Invitation;
