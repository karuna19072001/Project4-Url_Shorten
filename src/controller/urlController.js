const urlModel = require("../models/urlModel")
const validUrl = require('valid-url');
const shortid = require('shortid');
const redis = require("redis");
const { promisify } = require("util");// here util its a package and promisify is a method on that pakage we are destructure it

// promisify covert callback function to promises in redis



const redisClient = redis.createClient(
  14782,                                                    //port no.
  "redis-14782.c264.ap-south-1-1.ec2.cloud.redislabs.com",  // id of redis
  { no_ready_check: true }
);
redisClient.auth("lpcUIQWib3PBPsT7RyoesCrEdlQM8NIk", function (err) {   //auth is use to check authentication
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValidReqBody = function (requestBody) {

    return Object.keys(requestBody).length > 0
}

const isValid = function (value) {

    if (typeof value === "undefined" || value === null) {
        return false
    }
    if (typeof value === "string" && value.trim().length == 0) {
        return false
    }
    return true
}

const createUrl= async function (req, res) {

    try {
        const baseUrl = "http://localhost:3000";
        const data = req.body;

        if (!isValidReqBody(data)) {
            return res.status(400).send({ status: false, msg: "Please Enter some data" })
        }

        if(isValidReqBody(req.query)){
            return res.status(400).send({status : false,msg : "url must present"})
        }


        const { longUrl } = data

        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, msg: "Bad Request!!! Please Provide Long Url to Be Shorten" })
        }

        if (!validUrl.isUri(baseUrl)) {
            console.log("invalid base url")
            return res.status(401).send({ status: false, msg: 'Invalid base URL' })
        }

        const short = shortid.generate()

        if (validUrl.isUri(longUrl)) {

            const shortForm = baseUrl + '/' + short
            let shortUrl = shortForm.toLowerCase()

            let checkforUrl = await GET_ASYNC(`${longUrl}`)
            if (checkforUrl) {
                console.log("This is coming from cache in shorten")
                JSON.parse(checkforUrl)
                return res.status(200).send({ status: true, msg: "This Url was Already Shorten",shortUrl: checkforUrl })
            }

            let url = await urlModel.findOne({ longUrl })
            if (url) {
                return res.status(200).send({ status: true, msg: "This Url was Already Shorten",data: url }) //---if already exist
            }


            let input = { longUrl: data.longUrl, shortUrl: shortUrl, urlCode: short }
            const CreatedUrl = await urlModel.create(input)
            const final = {
                longUrl: CreatedUrl.longUrl,
                shortUrl: CreatedUrl.shortUrl,
                urlCode: CreatedUrl.urlCode
            }
            await SET_ASYNC(`${longUrl}`, JSON.stringify(input))

            res.status(201).send({ status: true, msg: "Short Url Created Succesfully", data: final })

        }
        else {
            res.status(400).send({ status: false, msg: "Invalid Long Url" })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, msg: err.message })
    }

}


const getUrl = async function(req,res){
    try{
        const urlCode = req.params.urlCode;

        if(!isValid(urlCode.toLowerCase())){
            return res.status(400).send({status : false , msg : "Please input Url Code In Params"})
        }
        if(isValidReqBody(req.body)){
            return res.status(400).send({status : false,msg : "Body Shouldnt Be Present"})
        }

      
        let cahcedUrlCode = await GET_ASYNC(`${req.params.urlCode}`)

        if(cahcedUrlCode) {
            parseData = JSON.parse(cahcedUrlCode)
            console.log("THis is from cache (get)")
            return res.status(302).redirect(parseData.longUrl)
        }

        const data = await urlModel.findOne({urlCode: urlCode}).select({createdAt:0,updatedAt:0,__v:0})
        if(!data){
            return res.status(404).send({status:false,msg : "No Such URL found"})        
        }

        else{
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(data))

            return res.status(302).redirect(data.longUrl)

        }
    }
    catch(error){
        return res.status(500).send({status: false,msg:error.message})
    }
}


module.exports.createUrl = createUrl
module.exports.getUrl = getUrl