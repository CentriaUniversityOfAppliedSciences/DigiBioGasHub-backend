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
import Settings from './settings.js';

Company.belongsToMany(User, { through: UserCompany, foreignKey: 'companyID' });
User.belongsToMany(Company, { through: UserCompany, foreignKey: 'userID' });

Company.hasMany(Location, { foreignKey: "companyID" });
Offer.belongsTo(Company, {foreignKey:"companyID"});
Offer.belongsTo(Material, {foreignKey:"materialID"});
Offer.belongsTo(User, {foreignKey:"creator"});
Company.hasMany(Offer, { foreignKey:"companyID"});
Contract.belongsTo(Offer, {foreignKey:"offerID"});
Contract.belongsTo(User, {foreignKey:"buyer"});
Contract.belongsTo(Company, {foreignKey:"companyID"});
Settings.belongsTo(User, { foreignKey: 'userID' });
Offer.hasMany(Contract, {foreignKey:"offerID"});
Offer.hasMany(Files, { foreignKey: 'parent' });
Offer.hasMany(Location, { foreignKey: 'parent' });

Subscription.belongsTo(User, { foreignKey: 'userID' });
User.hasMany(BlogPost, { foreignKey: 'userID' });

export { User, Hub, Company, Location, UserCompany, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription };
