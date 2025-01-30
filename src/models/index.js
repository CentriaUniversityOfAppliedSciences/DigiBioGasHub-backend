import  User  from './user.js';
import  Hub  from './hub.js';
import  Company  from './company.js';
import  Location  from './location.js';
import  UserCompany  from './usercompany.js';
import Logs from './logs.js';
import Contract from './contract.js';
import Offer from './offer.js';
import Material from './material.js';
import Bids from './bids.js';

//User.hasMany(UserCompany, { foreignKey: 'userID' });
//UserCompany.belongsTo(User, { foreignKey: 'id' });
User.belongsToMany(Company, { through: UserCompany, foreignKey: 'userID' });
//Company.hasMany(User, { through: UserCompany, foreignKey: 'companyID' })

//Company.hasMany(UserCompany, { foreignKey: 'companyID' });
//UserCompany.belongsTo(Company, { foreignKey: 'id' });
Company.hasMany(Location, { foreignKey: "companyID"});
//Company.hasMany(Offer, {foreignKey:"companyID"});
Offer.belongsTo(Company, {foreignKey:"companyID"});
//Material.hasMany(Offer,{foreignKey:"materialID"});
Offer.belongsTo(Material, {foreignKey:"materialID"});
//Location.hasMany(Offer,{foreignKey:"locationID"});
Offer.belongsTo(Location, {foreignKey:"locationID"});
//User.hasMany(Offer,{foreignKey:"creator"});
Offer.belongsTo(User, {foreignKey:"creator"});
//Location.belongsTo(Company, { foreignKey: 'id' });
//Company.hasMany(Location, { foreignKey: 'companyID' });
Company.hasMany(Offer, { foreignKey:"companyID"});
Contract.belongsTo(Offer, {foreignKey:"offerID"});
Offer.hasOne(Contract, {foreignKey:"offerID"});
//Offer.belongsTo(Company);


export { User, Hub, Company, Location, UserCompany, Logs, Contract, Offer, Material, Bids };
