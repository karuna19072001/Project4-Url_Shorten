const urlModel =require("../Models/urlModel")
//const ValidURL = require('valid-url');
const shortid = require('shortid');
const redis = require("redis");
const { promisify } = require("util");// hear util its a package and promisify is a method on that pakage we are distructure it

// promisify covert callback function to promises in redies



const redisClient = redis.createClient(
    16426,
    "redis-16426.c264.ap-south-1-1.ec2.cloud.redislabs.com",  // id of redis
    { no_ready_check: true }
  );
  redisClient.auth("lNV3HtOiYo6Gx9Rx8mmMMgsp6rS8TI5h", function (err) {   //auth is use to check authentication
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const urlCode = shortid.generate()
const createUrl = async function (req, res) {
    try {
        const data = req.body
        const { longUrl } = data

        const baseurl = 'http://localhost:3000'


        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, msg: "Please enter Long url" })
        }
        

        if (!/^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(longUrl)) {

           return res.status(400).send({ status: false, message: "please provide valid URL" })
        }


        const shortUrll = await urlModel.findOne({ longUrl: longUrl })
        console.log(shortUrll)

        if (isValid(shortUrll)) {
            return res.status(200).send({ status: true, data: shortUrll })
        }
        else {
            const shortUrl = baseurl + '/' + urlCode
            const result = await urlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode })
            const saveShortUrl = await SET_ASYNC(`${urlCode}`, JSON.stringify(result.shortUrl))   
            console.log(saveShortUrl)      
             //if data is not in catch that time set command find that in DB.. jb mil jata he to use  string me convert krte he 
            return res.status(201).send({ status: true, msg: "Data created sucessfully", data: result })
        }
    } catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}




//SECOND API PULL LONG URL BY REDIRECTING
const getUrl = async function (req, res) {
  try {
    const urlCode = req.params.urlCode.trim().toLowerCase()
    if (!isValid(urlCode)) {
     return res.status(400).send({ status: false, message: 'Please provide valid urlCode' })
    }
    //---FETCH THE DATA BY URLCODE IN REDIS
    let checkforUrl = await GET_ASYNC(`${urlCode}`)      // here we are check data on cache  ager he to o data return krega
    if (checkforUrl) {
      return res.redirect(302, checkforUrl) 
    }
    //---FETCH THE DATA IN MONGO DB IF IT IS NOT PRESENT IN CACHE
    const url = await urlModel.findOne({ urlCode: urlCode })
    //console.log(url)
    if (!url) {
      return res.status(404).send({ status: false, message: 'No URL Found' })
    }
    //---SET GENERATE DATA IN CACHE
    await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl))    //(agr url hota he to o model se find krega or string me covert krke data de dega)
    return res.redirect(302, url.longUrl)
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error')
  }
}




// const getUrl = async function (req, res) {
//     try {
        
//       let cachedUrlCode = await GET_ASYNC(req.params.urlCode.trim().toLowerCase());
//       if (cachedUrlCode) {
//         console.log("data from cache memory")
//         res.status(302).redirect(cachedUrlCode);
//       } else {
//         const url = await urlModel.findOne({ urlCode: req.params.urlCode });
//         if (url) {
//           res.status(302).redirect(url.longUrl);
//         } else {
//           // else return a not found 404 status
//           return res.status(404).send({ status: false, msg: "No URL Found" });
//         }
//       }
//       // exception handler
//     } catch (err) {
//       console.error(err);
//       res.status(500).send({status:false, msg:err.message});
//     }
//   }

module.exports.createUrl = createUrl
module.exports.getUrl = getUrl