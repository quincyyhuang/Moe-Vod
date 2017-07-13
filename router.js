//Dependencies
const url = require('url')
const path = require('path')
const querystring = require('querystring')
var request = require('request')
var fs = require('fs')

//Data
const videoExt = ['.mp4', '.rmvb']
var videoList = []

module.exports = function(app) {
    app.get('/', (req, res) => {
        res.render('index')
    })

    app.get('/list', (req, res) => {
        videoList = []
        getAllVideo('/av/av')
        var nameList = []
        videoList.forEach((i) => {
            nameList.push(path.basename(i, path.extname(i)))
        })
        res.render('list', {
            'name': nameList,
            'video': videoList
        })
    })

    app.get('/vod', (req, res) => {
        var sourceMP4 = req.query.d.substring(3)
        var title = path.basename(sourceMP4, path.extname(sourceMP4))
        res.render('vod', {
            'title': title,
            'sourceMP4': sourceMP4
        })
    })
}

function getAllVideo(p) {
    if (fs.statSync(p).isFile()) {
        //Check extension
        if (videoExt.includes(path.extname(p))) videoList.push(p)
    } else if (fs.statSync(p).isDirectory() && path.basename(p) != 'node_modules' && path.basename(p)[0] != '.') {
        var files = fs.readdirSync(p)
        files.forEach((f) => {
            getAllVideo(path.join(p, f))
        })
    }
}