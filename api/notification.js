'use strict';

var express = require('express');
var gcm = require('node-gcm');

var send_gcm = function(message1, jsonData, device, callback) {
}		


module.exports = exports;


 

 
// Create a message 
// ... with default values 
var message = new gcm.Message({
  collapseKey: "applice",
  delayWhileIdle: true,
  timeToLive: 3,
  data: {
    title: "Hello, World",
    icon: "icon",
    message: "This is a notification that will be displayed ASAP."
  }
});
// Set up the sender with you API key 
var sender = new gcm.Sender('AIzaSyD-owRF6gP7rZNCNbv6ww2rCrKrrLrSYhk');
 
// Add the registration tokens of the devices you want to send to 
var registrationTokens = [];
registrationTokens.push('APA91bGvxS9obvfNUOx2ppb6Zscz3gQft2Iuo1N_tumQLP4hashbPTYEFwMelAgQLEFbfqiHapcPdzopDkp1QhCoAPypjfgyZMXYfSUSBIebna0Ync_XrOSe1HE3Z1oaDKgGx00BV0ql');
// ... or retrying a specific number of times (10) 
sender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
  if(err) console.error(err);
  else    console.log(response);
});
