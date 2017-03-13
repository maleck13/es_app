var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

function sysRoute() {
  var sys = new express.Router();
  sys.use(cors());
  sys.use(bodyParser());


  sys.get("/info/ping", function (req,res){
    res.send("\"OK\"");
  });
  return sys;
}

module.exports = sysRoute