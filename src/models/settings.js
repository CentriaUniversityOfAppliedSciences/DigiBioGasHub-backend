import { DataTypes } from "sequelize";
import sequelize from "./database";
import e from "express";

const Settings = sequelize.define("Settings", {
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
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false,
  }
});

export default Settings;