import pg from 'pg'; 
//import {compare as comparePass} from './cryptic.js';

export const pgconnector = () => {
    return "";
}
export default pgconnector;
    
     export async function createConnection(){
        const client = new pg.Pool({
            user: process.env.POSTGRES_USER,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            database: process.env.POSTGRES_DB,
            password: process.env.POSTGRES_PASSWORD
        });
        return client;
    };
    
    export async function closeConnection(client){
        return await client.end();
    };
    
    export async function getHub(client,ipaddr){
        var ans = await client.query('SELECT * from public."Hubs" WHERE origin = $1',[ipaddr]).then(res=> { return res;}).catch(e => { console.log(e); return null;});
        return ans;
    }
    export async function authUser(client,user,password){
        var ans = await client.query('SELECT * FROM public."frontusers" WHERE username = $1',[user]).then(res => {return res;}).catch(e => { console.log(e); return null;});
        if (ans.rows != undefined && ans.rows != null && ans.rows.length > 0){
            if (ans.rows[0] != undefined && ans.rows[0] != null){
                
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
        
    };
    /*export async function getUser(client,user){
        var ans = await client.query('SELECT * FROM public."frontusers" WHERE username = $1',[user]).then(res => {return res;}).catch(e => { console.log(e); return null;});
        return ans;
    };
    export async function createUser(client,user,pass){
        var ans = await client.query('INSERT INTO public."frontusers" (username,passwordhash,userlevel) VALUES($1,$2,$3)',[user,pass,1]).then(res => {return res;}).catch(e => { console.log(e); return null;});
        return ans;
    };
    export async function getUserFileList(client,user){
        var ans = await client.query('SELECT * from isometadata where userid = $1',[user]).then(res=> { return res;}).catch(e=>{console.log(e); return null;});
        return ans;
    }
    export async function getUserFileListGrainsense(client,device){
        var ans = await client.query('SELECT * from grainsense WHERE device = $1 ',[device]).then(res=> { return res;}).catch(e=>{console.log(e); return null;});
        return ans;
    }
    /*createTable: async function (client,tablename) {
        await client.query('CREATE TABLE IF NOT EXISTS $1(id BIGSERIAL PRIMARY KEY)').then(res => { console.log("table created"); }).catch(e => console.log(e));
    },*/
    export async function insertTable(client, query, values){
        var ans = await client.query(query, values)
            .then(res => {
                return res;
            })
            .catch(e => console.log(e.stack));
            return ans;
    };
    
    export async function checkExists(client, table){
        var ans = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2)",["public",table]).then(res=> { return res;}).catch(e => {console.log(e); return null;});
        return ans;
    }
    export async function query(client,text,params){
        try{
            //const res = await client.query(query,values);
            //const res = await client.query("s");
            const res = client.query(text,params);
            //console.log(res.rows[0]);
            return res;
        }
        catch(ex){
            console.log(ex);
            return null;
        }
        
    };