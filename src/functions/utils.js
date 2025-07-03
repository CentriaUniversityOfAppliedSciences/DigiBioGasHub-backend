import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


/*
* function to get coordinates from address, zipcode and city
* @param {string} address
* @param {string} zipcode
* @param {string} city

*/

function getCoords(address, zipcode, city){
  
  
	return new Promise(async (resolve, reject) => {
		try {
			axios.get('https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search', {
				params: {
					"text": address + " " + zipcode + " " + city,
					"sources": "interpolated-road-addresses",
					"lang": "fi",
					"api-key": process.env.MML_API_KEY
				}
			}).then(async (x) => {
				console.log(x);
				if (x.status == 200 && x.data != undefined && x.data.features != undefined && x.data.features.length > 0 && x.data.features[0].geometry != undefined) {
					const result = x.data.features[0].geometry.coordinates;//proj4("EPSG:3067", "EPSG:4326", x.data.features[0].geometry.coordinates);
					const obj = { lat: result[1], lng: result[0] };
					//res.send({ "data": x.data, "result": "ok" });
					resolve({ "data": obj, "result": "ok" });
				}
				else if (x.data == undefined || x.data.features == undefined || x.data.features.length == 0 || x.data.features[0].geometry == undefined) {
					try {
						axios.get('https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search', {
							params: {
								"text": address,
								"sources": "addresses",
								"lang": "fi",
								"api-key": process.env.MML_API_KEY
							}
						}).then(async (x) => {
							console.log(x);
							if (x.status == 200 && x.data != undefined && x.data.features != undefined && x.data.features.length > 0 && x.data.features[0].geometry != undefined) {
								const result = x.data.features[0].geometry.coordinates;//proj4("EPSG:3067", "EPSG:4326", x.data.features[0].geometry.coordinates);
								const obj = { lat: result[1], lng: result[0] };
								//res.send({ "data": x.data, "result": "ok" });
								resolve({ "data": obj, "result": "ok" });
							}
							else if (x.data == undefined || x.data.features == undefined || x.data.features.length == 0 || x.data.features[0].geometry == undefined) {

								console.log("Address not found for address: " + address);
								//res.send({ "data": "address not found" });
								resolve({ "data": "address not found", "result": "nfound" });
							}
							else {
								reject(x);
							}
						}).catch((e) => {
							reject(e);
						})
					}
					catch (e) {
						reject(e);
				  }
        }
				else {
					reject(x);
				}
			}).catch((e) => {
				reject(e);
			})
		}
		catch (e) {
			reject(e);
		}
	});
}

/*
* function to check if jwt token is valid, uses jwt.verify
*/
async function secTest(token){
  try{
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    return [true,decoded];
  }
  catch(error){
    return [false,null];
  }
}

/*
* function to check if user is admin, uses jwt.verify
*/

async function adminTest(token){
  try{
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (decoded.userlevel == 99){
      return [true,decoded];
    }
    else{
      return [false,decoded];
    }
  }
  catch(error){
    return [false,null];
  }
}

/*
* function to generate API key
*/
function generateApiKey(length = 60) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = crypto.randomBytes(length);
	let key = '';
  
	for (let i = 0; i < length; i++) {
	  key += chars[bytes[i] % chars.length];
	}
  
	return 'digibio_' + key;
  }

export { getCoords, secTest, adminTest, generateApiKey };
