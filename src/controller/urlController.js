const urlModel = require("../models/urlmodel")

//let axios = require("axios")
const shortid = require('shortid')
const validUrl = require('valid-url')
const isValid = function (value) {
    if (typeof value == undefined || value == null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const baseUrl = 'http://localhost:3000'

const createUrl = async function (req, res) {
    try {

        data = req.body

        const { longUrl } = data

        if (!Object.keys(data).length > 0) {
            return res.status(400).send({ status: false, message: "please iput Some data" })
        }

        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "please input longUrl" })
        }

        if (!(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/.test(longUrl))) {

            return res.status(400).send({ status: false, message: "please enter a valid URL" })
        }

        if (!validUrl.isUri(baseUrl)) {
            return res.status(401).send('Invalid base URL')
        }

        const urlCode = shortid.generate()
        //const shortUrl = baseUrl + '/' + urlCode


        if (validUrl.isUri(longUrl)) {

            let url = await urlModel.findOne({ longUrl })

            if (url) {
                return res.status(200).send({ status: true, message: "urlCode  already exsit", msg: url })

            } else {

                const shortUrl = baseUrl + '/' + urlCode
               
                url = await urlModel.create({ longUrl, shortUrl, urlCode })

                return res.status(201).send({ status: true, message: url })
            }

        }

    }
    catch (err) {

        return res.status(500).send('Server Error')
    }

}



let getUrl = async function (req, res) {
    try {
        const data = req.params.urlCode

        const output = await urlModel.findOne({ urlCode: data })

        if (!output) {
            return res.status(404).send({ status: false, message: "not found" })
        }

        return res.status(302).redirect(output.longUrl)               //temporary move && 301 means permantaly move
    }
    catch (err) {

        return res.status(500).send('Server Error')
    }

}




module.exports.createUrl = createUrl
module.exports.getUrl = getUrl