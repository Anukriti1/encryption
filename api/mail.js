'use strict';

var express = require('express');
var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport 
var transporter = nodemailer.createTransport('smtps://chetan.enbake1@gmail.com:enbake123@smtp.gmail.com');
 
var smtpTransport = nodemailer.createTransport("SMTP",{
   service: "Gmail",  // sets automatically host, port and connection security settings
   auth: {
       user: "chetan.enbake1@gmail.com",
       pass: "enbake123"
   }
});


// send Email
exports.send_mail = function(message,emails){
  console.log('here')
  smtpTransport.sendMail({  //email options
     from: "e-scheduling <chetan.enbake1@gmail.com>", // sender address.  Must be the same as authenticated user if using Gmail.
     to: emails, // receiver
     subject: "e-scheduling Notification", // subject
     html: '<b>Hello,</b> </br> <p>'+message+'</p>' // body
  }, function(error, response){  //callback
     if(error){
         console.log(error);
     }else{
         console.log("Message sent: " + response.message);
     }
     smtpTransport.close(); // shut down the connection pool, no more messages.  Comment this line out to continue sending emails.
  }); 
}
module.exports = exports;
