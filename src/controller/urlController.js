const urlModel = require("../models/urlmodel")

//let axios = require("axios")
const shortid = require('shortid')
const validUrl = require('valid-url')
const redis = require("redis");
const { promisify } = require("util");

const isValid = function (value) {
    if (typeof value == undefined || value == null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const redisClient = redis.createClient(
    16426,
    "redis-16426.c264.ap-south-1-1.ec2.cloud.redislabs.com",   //i change here on the end there is port number i remove it
    { no_ready_check: true }
);
redisClient.auth("lNV3HtOiYo6Gx9Rx8mmMMgsp6rS8TI5h", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const createUrl = async function (req, res) {
    // try {


        const baseUrl = 'http://localhost:3000'

        data = req.body

        const { longUrl } = data

        if (!Object.keys(data).length > 0) {
            return res.status(400).send({ status: false, message: "please iput Some data" })
        }

        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "please input longUrl" })
        }


        if (!validUrl.is_http_uri(longUrl))
         return res.status(400).send({ status: false, message: "please enter a valid URL" })
        

        // if (!validUrl.isHttpsUri
        //     (baseUrl)) {
        //     return res.status(401).send('Invalid base URL')
        // }

        const urlCode = shortid.generate().toLowerCase()
        //const shortUrl = baseUrl + '/' + urlCode
    if (validUrl.is_http_uri(longUrl)) {

        url = await urlModel.findOne({ longUrl })

            if (url) {
                return res.status(200).send({ status: true, message: "urlCode  already exsit", msg: url })

            } else {

                const shortUrl = baseUrl + '/' + urlCode

            

                url = await urlModel.create({ longUrl, shortUrl, urlCode })



                return res.status(201).send({ status: true, message: url })
            }

        }




    // }
    // catch (err) {

    //     return res.status(500).send('Server Error')
    // }

}




let getUrl = async function (req, res) {
    
        const data = req.params.urlCode


        let cahcedData = await GET_ASYNC(`${data}`)
          if(cahcedData) {
           return res.send(cahcedData)
          }

        const output = await urlModel.findOne({ urlCode: data })

        if (!output) {
            return res.status(404).send({ status: false, message: "not found" })
        }
        await SET_ASYNC(`${data}`, JSON.stringify(output))
       return  res.redirect({ output});
       

        //return res.status(200).redirect(output.longUrl)               //temporary move && 301 means permantaly move
    }
  






module.exports.createUrl = createUrl
module.exports.getUrl = getUrl


