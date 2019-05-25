const request = require('request')

module.exports = async (value) => 
    new Promise((resolve, reject) => {
        request(value, (error, response, html) => {
            if(error) reject(error)
            else resolve(html)
        })
    })