import { DataTypes } from 'sequelize';

import sequelize from './database.js';

const Openapi = sequelize.define("Openapi", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  userID: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  companyID: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('user', 'company'),
    allowNull: false,
    defaultValue: 'user',
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['userID', 'type'],
      where: { type: 'user' }
    },
    {
      unique: true,
      fields: ['companyID'],
      where: { type: 'company' }
    }
  ]
});

export default Openapi;
