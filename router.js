//Dependencies
const url = require('url')
const path = require('path')
var fs = require('fs')
var express = require('express')
const NodeCache = require('node-cache')

// Data
try {
    var config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
} catch(e) {
    console.log('Bad config file.')
    process.exit()
}
const fileRoot = config.path || __dirname
const userCollection = config.userCollection

const videoExt = ['.mp4']
var myCache = new NodeCache()

// Router
var router = express.Router()

// Routes
router.get('/', (req, res) => {
    if (req.session.login == true) return res.redirect('/list')
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
        return res.sendStatus(200)
    } else {
        req.session.login = false
        return res.sendStatus(400)
    }
})

router.get('/logout', (req, res) => {
    if (req.session.login != true) return res.redirect('/')
    req.session.destroy((err) => {
        if (err) console.log(err)
        return res.redirect('/')
    })
    // req.session.regenerate((err) => {
    //     // will have a new session here
    //     req.session.login = false
    //     res.redirect('/')
    // })
})

router.get('/list', (req, res) => {
    if (req.session.login != true) return res.redirect('/')
    var cwd = req.query.p || fileRoot
    var token = myCache.get('token')
    if (!token) {
        token = generateToken()
    }
    myCache.set('token', token, 5*60*60)
    var info = getCWDInfo(cwd)
    return res.render('list', {
        path: path,
        token: token,
        cwd: cwd,
        info: info
    })
})

router.get('/file', (req, res) => {
    var file = req.query.p
    var action = req.query.action
    if (!file) return res.redirect('/list')
    else {
        if (videoExt.includes(path.extname(file))) {
            if (req.session.login) {
                if (action == 'play') {
                    return res.sendFile(file)
                }
                else {
                    var token = myCache.get('token')
                    if (!token) {
                        token = generateToken()
                    }
                    myCache.set('token', token, 5*60*60)
                    var sourceMP4 = '/file?p=' + file + '&action=play'
                    sourceMP4 = sourceMP4.replace(/\\/g, '\\\\')
                    var downloadMP4 = '/file?p=' + file + '&action=download' + '&token=' + token
                    downloadMP4 = downloadMP4.replace(/\\/g, '\\\\')
                    var title = path.basename(sourceMP4, path.extname(sourceMP4))
                    return res.render('vod', {
                        'title': title,
                        'sourceMP4': sourceMP4,
                        'downloadMP4': downloadMP4
                    })
                }
            }
            else if (action == 'download') {
                if (req.session.login || req.query.token == myCache.get('token')) return res.download(file)
            } 
            else {
                return res.redirect('/')
            }
        } else {
            if (req.session.login || req.query.token == myCache.get('token')) return res.download(file)
            else return res.sendStatus(403)
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