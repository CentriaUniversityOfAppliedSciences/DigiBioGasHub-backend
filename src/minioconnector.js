
import * as Minio from 'minio'



    const createConnection = async function (){
        var client = new Minio.Client({
            endPoint: 'localhost',
            port:9000,
            useSSL:false,
            accessKey: process.env.MINIO_ROOT_USER,
            secretKey: process.env.MINIO_ROOT_PASSWORD
        });
        return client;
    };
    
    const closeConnection = async function (client){

        return null;
    };
    const checkfolder = async function(client,folder){
        try{
            client.bucketExists(folder)
        }
        catch(ex){
            console.log(ex);
            return null;
        }
    };
    const checkFile = async function (client,folder,filename){
        try{
            const exists = await client.statObject(folder,filename);
            if (exists){
                return true;
            }
            else{
                return null;
            }
        }   
        catch(ex){
            console.log(ex);
            return null;
        }
    };
    const insert = async function (client,file,filename,folder){
        try{
            const exists = await client.bucketExists(folder);
            if (exists){
                const inserted = await client.putObject(folder,filename,file);
                return;
            }
            else{
                const created = await client.makeBucket(folder);
                const inserted = await client.putObject(folder,filename,file);
                return;
            }
            
        }
        catch(ex){
            console.log(ex);
            return null;
        }
        
    };

    const getLink = async function (client,folder,filename){
        try {
            // Generate a presigned URL for the object
            let tempLink = await client.presignedUrl('GET', folder, filename);
            if (process.env.MINIO_DEV == "false"){
                tempLink = tempLink.replace('http://localhost:9000',process.env.MINIO_ADDRESS);
            }
            return tempLink; // Return the generated link
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            throw error; // Re-throw the error for handling in the calling code
        }
    }

    export default {
        createConnection,
        closeConnection,
        checkfolder,
        checkFile,
        insert,
        getLink
    }
