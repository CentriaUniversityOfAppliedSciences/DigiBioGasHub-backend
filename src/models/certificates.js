import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';

const Certificates = sequelize.define("Certificates", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

export default Certificates;