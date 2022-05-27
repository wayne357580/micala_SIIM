'use strict';

const debug = require('debug')('DICOM Server');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const compress = require('compression');
//login
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const flash =require('connect-flash');
const mongodb = require('./models/mongodb');
const {checkFieldDataIsHeap} = require("./models/elasticsearch");
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')({session:session});
//
require('dotenv').config();
const port = process.env.SERVER_PORT;
const app = express();

require('rootpath')();
require('dotenv').config()
debug('Start DICOM Server...');
app.use(compress());
app.use(flash());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.json({"type" : "application/fhir+json"}));
app.use(bodyParser.text({"type" : "text/*"}));
app.use(bodyParser.raw({ "type" : "multipart/related" , limit: "1000mb"}));
app.use(bodyParser.raw({ "type" : "multipart/form-data" , limit: "1000mb"}));
app.use((err, req, res, next) => {
  // This check makes sure this is a JSON parsing issue, but it might be
  // coming from any middleware, not just body-parser:

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error(err);
      return res.sendStatus(400); // Bad request
  }

  next();
});
app.use(cookieParser());
//login
app.use(session({
    secret: 'micalasecret',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }) ,
    httpOnly: true
}));
app.use(passport.initialize());
app.use(passport.session());
//
//app.use(expressValidator());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept ,Authorization");
  res.header("Vary" , "Origin");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

//login
require('models/user/passport.js')(passport);
require("routes.js")(app, passport);
app.engine('html' , require('ejs').renderFile);

/**
 * init es indices
 */
(async()=> {
  const { ESMyTestImagingStudy } = require('./models/elasticsearch/my-testimagingstudy');
  let esMyTestImagingStudy = new ESMyTestImagingStudy();
  await esMyTestImagingStudy.init();
  const { ESMyReport } = require('./models/elasticsearch/my-report');
  let esMyReport = new ESMyReport();
  await esMyReport.init();
})();


if(process.env.NODE_ENV !== 'production') {
  http.createServer(app).listen(port , function (){
    console.log(`http server is listening on port:${port}`);
  });
} else {
  checkFieldDataIsHeap().then((isSuccessed)=> {
    if (!isSuccessed) {
      console.error("Can not connect to elasticsearch");
      process.exit(1);
    }
    http.createServer(app).listen(port , function (){
      console.log(`http server is listening on port:${port}`);
    });
  });
}

module.exports = app;