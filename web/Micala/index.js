const express = require('express');
const router = express.Router();
const path = require('path');
const {isLogin}  = require('../../api/Api_function');

router.get('/', function (req, res) {
    res.sendFile('index.html', {
        root: __dirname + '../../../public/html'
    });
});

router.get('/search', isLogin, function (req, res) {
    res.sendFile('ESsearch.html', {
        root: __dirname + '../../../public/html'
    });
});

router.get('/reportContent' , isLogin  , function (req ,res) {
    res.sendFile('ESreportContent.html' , {
      root : __dirname + '../../../public/html'
    });
});

module.exports = router;