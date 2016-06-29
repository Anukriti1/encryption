'use strict';

var express = require('express');
var gcm = require('node-gcm');
// Set up the sender with you API key 
var sender = new gcm.Sender('AIzaSyD-owRF6gP7rZNCNbv6ww2rCrKrrLrSYhk');
// send gcm to a device
exports.send_gcm = function(message,device,callback){
  var message = new gcm.Message({collapseKey: "applice",delayWhileIdle: true,timeToLive: 3,
    data: {
      title: "e-scheduling",
      icon: "icon",
      message: message
    }
  });
  sender.send(message, { registrationTokens: device }, 10, function (err, response) {
    if(err) callback(err);
    else    callback(response);
  });
}

module.exports = exports;