import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';

const CompanyCertificates = sequelize.define("CompanyCertificates", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  companyID: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name:{
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file:{
    type:DataTypes.TEXT,
    allowNull: true
  },
  original:{
    type: DataTypes.UUID,
    allowNull: true
  }
});

export default CompanyCertificates;