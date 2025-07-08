import  User  from './user.js';
import  Hub  from './hub.js';
import  Company  from './company.js';
import  Location  from './location.js';
import  UserCompany  from './usercompany.js';
import Invitation from './invitation.js';
import Logs from './logs.js';
import Contract from './contract.js';
import Offer from './offer.js';
import Material from './material.js';
import Bids from './bids.js';
import BlogPost from './BlogPost.js';
import Files from './files.js';
import Subscription from './subscription.js';
import Settings from './settings.js';
import Logistics from './logistics.js';
import Openapi from './openapi.js';
import Certificates from './certificates.js';
import CompanyCertificates from './companycertificates.js';

Company.belongsToMany(User, { through: UserCompany, foreignKey: 'companyID' });
User.belongsToMany(Company, { through: UserCompany, foreignKey: 'userID' });
UserCompany.belongsTo(User, { foreignKey: 'userID' });
UserCompany.belongsTo(Company, { foreignKey: 'companyID' });

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
Openapi.belongsTo(User, { foreignKey: 'userID' });
Openapi.belongsTo(Company, { foreignKey: 'companyID' });
Company.hasMany(Logistics, { foreignKey: 'companyID' });
Logistics.belongsTo(Company, { foreignKey: 'companyID' });
CompanyCertificates.belongsTo(Company, { foreignKey: 'companyID' });
Company.hasMany(CompanyCertificates, { foreignKey: 'companyID' });
Subscription.belongsTo(User, { foreignKey: 'userID' });
User.hasMany(BlogPost, { foreignKey: 'userID' });

User.hasMany(Subscription, { foreignKey: 'userID' });
Subscription.belongsTo(User, { foreignKey: 'userID' });

User.hasMany(Subscription, { foreignKey: 'userID' });
Subscription.belongsTo(User, { foreignKey: 'userID' });

export { User, Hub, Company, Location, UserCompany, Invitation, Logs, Contract, Offer, Material, Bids, BlogPost, Files, Settings, Subscription, Logistics, Openapi, Certificates, CompanyCertificates };
