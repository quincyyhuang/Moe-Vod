//Dependencies
const url = require('url')
const path = require('path')
var fs = require('fs')
var express = require('express')
const NodeCache = require("node-cache")

// Data
const userCollection = {
    'quincy': 'quincyhuang123!'
}
const fileRoot = '/root/files'
const videoExt = ['.mp4']
var myCache = new NodeCache()

// Router
var router = express.Router()

// Routes
router.get('/', (req, res) => {
    res.render('index', {
        'alert': false
    })
})

router.post('/login', (req, res) => {
    var u = req.body.username
    var p = req.body.password
    if (p == userCollection[u]) {
        // OK
        req.session.login = true
        res.redirect('/list')
    } else {
        req.session.login = false
        res.render('index', {
            'alert': 'invalidCertification'
        })
    }
})

router.get('/logout', (req, res) => {
    // req.session.destroy((err) => {
    //     if (err) console.log(err)
    //     res.redirect('/')
    // })
    req.session.regenerate((err) => {
        // will have a new session here
        req.session.login = false
        res.redirect('/')
    })
})

router.get('/list', (req, res) => {
    var cwd = req.query.p || fileRoot
    var token = generateToken()
    myCache.set('token', token, 3600)
    var info = getCWDInfo(cwd)
    res.render('list', {
        path: path,
        token: token,
        cwd: cwd,
        info: info
    })
})

router.get('/file', (req, res) => {
    var file = req.query.p
    if (!file) res.redirect('/list')
    else {
        if (videoExt.includes(path.extname(file))) {
            if (req.session.login) {
                var sourceMP4 = file
                var title = path.basename(sourceMP4, path.extname(sourceMP4))
                res.render('vod', {
                    'title': title,
                    'sourceMP4': sourceMP4
                })
            } else {
                res.render('index', {
                    'alert': 'invalidSession'
                })
            }
        } else {
            if (req.session.login || req.query.token == myCache.get('token')) res.download(file)
            else res.status(403).end()
        }
    }
})

function getCWDInfo(cwd) {
    var info = {
        directories: [],
        files: []
    }
    var items = fs.readdirSync(cwd)
    items.forEach((i) => {
        var abs = path.join(cwd, i)
        if (fs.statSync(abs).isDirectory()) info.directories.push(abs)
        else if (fs.statSync(abs).isFile()) info.files.push(abs)
    })
    return info
}

function generateToken() {
    var choice = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

    function getAnIndex() {
        return Math.floor(Math.random() * 31)
    }

    var result = ''
    for (var i = 0; i < 20; i++) result += choice[getAnIndex()]
    return result
}

// Export
module.exports = router