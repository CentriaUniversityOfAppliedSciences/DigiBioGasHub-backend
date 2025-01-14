import { Sequelize } from "sequelize";
import 'dotenv/config'

const sequelize = new Sequelize(process.env.POSTGRES_DB,process.env.POSTGRES_USER,process.env.POSTGRES_PASSWORD,{
    dialect: 'postgres'
});

try{
    await sequelize.authenticate();
    console.log("connection ready");
}
catch(error){
    console.log(error);
}

export default sequelize;