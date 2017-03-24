var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var redis = require("redis");
var MongoClient = require('mongodb').MongoClient;
   
function helloRoute() {
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

  return hello;
}

module.exports = helloRoute;
