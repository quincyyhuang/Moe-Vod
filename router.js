//Dependencies
const url = require('url')
const path = require('path')
var fs = require('fs')

//Data
const videoExt = ['.mp4', '.rmvb']
const filterString = ['台', '裸聊', '美女', 'UU23', '.net']
const userCollection = {
    'quincy': 'quincyhuang',
    'wjw': 'wangjiewen'
}
var videoList = []

module.exports = function(app) {
    app.get('/', (req, res) => {
        res.render('index', {
            'alert': false
        })
    })

    app.post('/login', (req, res) => {
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

    app.get('/list', (req, res) => {
        if (req.session.login) {
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
        } else {
            res.render('index', {
                'alert': 'invalidSession'
            })
        }
    })

    app.get('/vod', (req, res) => {
        if (req.session.login) {
            var sourceMP4 = req.query.d.substring(3)
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
    })

    app.get('/logout', (req, res) => {
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
}

function getAllVideo(p) {
    if (fs.statSync(p).isFile()) {
        //Check extension
        if (videoExt.includes(path.extname(p))) {
            // Filter
            var valid = true
            for (var i = 0; i < filterString.length; i++) {
                if (p.includes(filterString[i])) {
                    valid = false
                    break
                }
            }
            if (valid == true) videoList.push(p)
        }
    } else if (fs.statSync(p).isDirectory() && path.basename(p) != 'node_modules' && path.basename(p)[0] != '.') {
        var files = fs.readdirSync(p)
        files.forEach((f) => {
            getAllVideo(path.join(p, f))
        })
    }
}