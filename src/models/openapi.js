import { DataTypes } from 'sequelize';

import sequelize from './database.js';

const Openapi = sequelize.define("openapi", {
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
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
});

export default Openapi;
