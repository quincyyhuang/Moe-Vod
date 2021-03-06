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
    myCache.set('token', token, 10*60*60)
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
            if (action == 'download') {
                if (req.session.login || req.query.token == myCache.get('token')) return res.download(file)
            }
            if (req.session.login) {
                if (action == 'play') {
                    return res.sendFile(file)
                }
                else {
                    var token = myCache.get('token')
                    if (!token) {
                        token = generateToken()
                    }
                    myCache.set('token', token, 10*60*60)
                    var sourceMP4 = '/file?p=' + encodeURIComponent(file) + '&action=play'
                    sourceMP4 = sourceMP4.replace(/\\/g, '\\\\')
                    var downloadMP4 = '/file?p=' + encodeURIComponent(file) + '&action=download' + '&token=' + token
                    downloadMP4 = downloadMP4.replace(/\\/g, '\\\\')
                    var title = path.basename(file, path.extname(file))
                    return res.render('vod', {
                        'title': title,
                        'sourceMP4': sourceMP4,
                        'downloadMP4': downloadMP4
                    })
                }
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

// Client API
router.post('/api/getToken', (req, res) => {
    var u = req.body.username
    var p = req.body.password
    if (p == userCollection[u]) {
        // OK
        var token = myCache.get('token')
        if (!token) {
            token = generateToken()
        }
        myCache.set('token', token, 10*60*60)
        return res.json({
            status: 200,
            token: token,
            fileRoot: fileRoot
        })
    } else {
        return res.json({
            status: 403,
            message: 'Bad password.'
        })
    }
})

router.post('/api/list', (req, res) => {
    var t = req.body.token
    var p = req.body.path
    let token = myCache.get('token')
    if (!token || t != token) {
        return res.json({
            status: 403,
            message: 'Bad token.'
        })
    }
    var cwd = p || fileRoot
    var info = getCWDInfo(cwd)
    return res.json({
        status: 200,
        info: info
    })
})

router.post('/api/play', (req, res) => {
    var t = req.body.token
    var p = req.body.path
    let token = myCache.get('token')
    if (!token || t != token) {
        return res.json({
            status: 403,
            message: 'Bad token.'
        })
    }
    if (!p) return res.json({
        status: 400,
        message: 'Bad request. File name missing.'
    })
    return res.sendFile(p)
})

function getCWDInfo(cwd) {
    var info = {
        directories: [],
        files: []
    }
    var token = myCache.get('token')
    if (!token) {
        token = generateToken()
    }
    myCache.set('token', token, 10*60*60)
    var items = fs.readdirSync(cwd)
    items.forEach((i) => {
        var abs = path.join(cwd, i)
        if (fs.statSync(abs).isDirectory()) info.directories.push(abs)
        else if (fs.statSync(abs).isFile()) {
            if (path.extname(abs) == '.mp4') {
                var downloadPath = '/file?p=' + abs + '&action=download' + '&token=' + token
                info.files.push({
                    path: abs,
                    downloadPath: downloadPath
                })
            }
            else info.files.push(abs)
        }
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