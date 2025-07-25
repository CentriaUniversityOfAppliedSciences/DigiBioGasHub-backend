import { DataTypes } from 'sequelize';
import  sequelize  from './database.js';

const OfferCertificates = sequelize.define("OfferCertificates", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  offerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  certificateId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

export default OfferCertificates;
