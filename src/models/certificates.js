import { DataTypes } from 'sequelize';

import  sequelize  from './database.js';

const Certificates = sequelize.define("certificates", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  companyID:{
    type: DataTypes.UUID,
    allowNull: false,
  },
  key:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false,
  }
});

export default Certificates;