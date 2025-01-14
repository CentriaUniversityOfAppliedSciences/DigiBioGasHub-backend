import  User  from './user.js';
import  Hub  from './hub.js';
import  Company  from './company.js';
import  Location  from './location.js';
import  UserCompany  from './usercompany.js';
import Logs from './logs.js';

//User.hasMany(UserCompany, { foreignKey: 'userID' });
//UserCompany.belongsTo(User, { foreignKey: 'id' });
User.belongsToMany(Company, { through: UserCompany, foreignKey: 'userID' });
//Company.hasMany(User, { through: UserCompany, foreignKey: 'companyID' })

//Company.hasMany(UserCompany, { foreignKey: 'companyID' });
//UserCompany.belongsTo(Company, { foreignKey: 'id' });

Location.belongsTo(Company, { foreignKey: 'id' });
//Company.hasMany(Location, { foreignKey: 'companyID' });


export { User, Hub, Company, Location, UserCompany, Logs };
