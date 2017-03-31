'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var redis = require("redis");
var MongoClient = require('mongodb').MongoClient;
var mysql = require('mysql');
   
function helloRoute(config) {
  var hello = new express.Router();
  hello.use(cors());
  hello.use(bodyParser());


  // GET REST endpoint - query params may or may not be populated
  hello.get('/', function(req, res) {
    console.log(new Date(), 'In hello route GET / req.query=', req.query);
    var world = req.query && req.query.hello ? req.query.hello : 'World';

    // see http://expressjs.com/4x/api.html#res.json
    res.json({msg: 'Hello ' + world});
  });

  // POST REST endpoint - note we use 'body-parser' middleware above to parse the request body in this route.
  // This can also be added in application.js
  // See: https://github.com/senchalabs/connect#middleware for a list of Express 4 middleware
  hello.post('/', function(req, res) {
    console.log(new Date(), 'In hello route POST / req.body=', req.body);
    var world = req.body && req.body.hello ? req.body.hello : 'World';

    // see http://expressjs.com/4x/api.html#res.json
    res.json({msg: 'Hello ' + world});
  });

  hello.get("/cache", function (req,res){
    var client = redis.createClient({
      "host":process.env.FH_REDIS_HOST
    });
    client.on("error", function (err){
      console.log(err);
      res.send(err.message);
      client.quit();
    });
    client.set("some key", "some val", function (err){
      if (err) {
        console.error(err);
        return res.send(err.message);
      }
      client.get("some key",function (err,val){
        res.send("got cache value " + val);
        client.quit();
      })
    });
  });

  hello.get("/mongo", function (req,res){
    MongoClient.connect(process.env.FH_MONGODB_CONN_URL, function(err, db) {
      if(err){
        return res.send(err.message);
      }
      console.log("Connected successfully to server");
      res.send("connected");
      db.close();
    });

  });

  hello.get("/mysql", function (req, res){
    var connection = mysql.createConnection({
      host     : process.env.MYSQL_HOST,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
      database : process.env.MYSQL_DATABASE
    });

    connection.connect();

    connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
      if (error) throw error;
      res.send("connected to MySQL server successfully");
    });
    connection.end();
  });

  hello.get("/push/:app", function (req,res){
    var upsPush = require('unifiedpush-node-sender');
    if (! config.push){
      return res.send("no push configuration found");
    }
    if(! config.push[req.params.app]){
      return res.send("no push configuration for app " + req.params.app);
    }
    var pushConfig = config.push[req.params.app];
    const settings = {
      url: process.env.PUSH_UPS_SERVICE_HOST + ":" + process.env.PUSH_UPS_SERVICE_PORT + '/ag-push',
      applicationId: pushConfig.pushApplicationID,
      masterSecret:  pushConfig.masterSecret
    };
    const message = {
        alert: 'Hi',
        title: 'Title',
        action: 'Action',
        sound: 'default',
        badge: 2
    };


   upsPush(settings).then((client) => {
      client.sender.send(message, {}).then((response) => {
        console.log('success', response);
        res.send(response);
      })
    })
    .catch(e =>{
      return res.send("error sending push " + e.message);
    })
  });
  return hello;
}

module.exports = helloRoute;
