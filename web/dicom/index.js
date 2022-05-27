'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const {isAdminLogin , isLogin}  =require('../../api/Api_function');

router.get('/updicom', isLogin,function(req, res) {
  res.sendFile('UploadDicom.html', {
    root: __dirname + '../../../public/html'
  });
});


router.get('/admin', isLogin, function(req, res) {
  res.sendFile('admin.html', {
    root: __dirname + '../../../public/html'
  });
});

router.get('/home', isLogin, function(req, res) {
  res.sendFile('home.html', {
    root: __dirname + '../../../public/html'
  });
});

router.get('/test', isLogin, function(req, res) {
  res.sendFile('test.html', {
    root: __dirname + '../../../public/html'
  });
});

router.get('/UserManager', isAdminLogin, function(req, res) {
  res.sendFile('UserManager.html', {
    root: __dirname + '../../../public/html'
  });
});

router.get('/imageMS' , isLogin , function (req ,res) {
  res.sendFile('ImageMS.html' , {
    root : __dirname + '../../../public/html'
  });
});

/*router.get('/reportContent' , isLogin , function (req ,res) {
  res.sendFile('reportContent.html' , {
    root : __dirname + '../../../public/html'
  });
});*/


module.exports = router;