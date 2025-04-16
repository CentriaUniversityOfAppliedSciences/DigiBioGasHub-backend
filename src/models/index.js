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
import BlogPost from './BlogPost.js';
import Files from './files.js';
import Subscription from './subscription.js';

//User.hasMany(UserCompany, { foreignKey: 'userID' });
//UserCompany.belongsTo(User, { foreignKey: 'id' });
Company.belongsToMany(User, { through: UserCompany, foreignKey: 'companyID' });
User.belongsToMany(Company, { through: UserCompany, foreignKey: 'userID' });

//Company.hasMany(UserCompany, { foreignKey: 'companyID' });
//UserCompany.belongsTo(Company, { foreignKey: 'id' });
Company.hasMany(Location, { foreignKey: "parent"});
//Company.hasMany(Offer, {foreignKey:"companyID"});
Offer.belongsTo(Company, {foreignKey:"companyID"});
//Material.hasMany(Offer,{foreignKey:"materialID"});
Offer.belongsTo(Material, {foreignKey:"materialID"});
//Location.hasMany(Offer,{foreignKey:"locationID"});
//Offer.belongsTo(Location, {foreignKey:"id"});
//User.hasMany(Offer,{foreignKey:"creator"});
Offer.belongsTo(User, {foreignKey:"creator"});
//Location.belongsTo(Company, { foreignKey: 'id' });
//Company.hasMany(Location, { foreignKey: 'companyID' });
Company.hasMany(Offer, { foreignKey:"companyID"});
Contract.belongsTo(Offer, {foreignKey:"offerID"});
Offer.hasMany(Contract, {foreignKey:"offerID"});
//Offer.belongsTo(Company);

Offer.hasMany(Files, { foreignKey: 'parent' })
Offer.hasMany(Location, { foreignKey: 'parent' })




User.hasMany(Subscription, { foreignKey: 'userID' });
User.hasMany(BlogPost, { foreignKey: 'userID' });

export { User, Hub, Company, Location, UserCompany, Logs, Contract, Offer, Material, Bids, BlogPost, Files};
