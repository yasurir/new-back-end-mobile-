var nodemailer = require("nodemailer");
//const config = require("./keys");
const user = require("./user");
const passwordResetApi = "http://localhost:3000/resetpassword/";
const emailConfirmApi = "http://localhost:3000/confirmemail";

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "niroshanratnayake07@gmail.com",
    pass: "zwyuudwsumnjrevi"
  }
});

//console.log(config.jwtexp)

exports.mailhandlerpasswordreset =  (email,username,id) => {
  console.log("sending resetpassword email ............");
  var mailOptions = {
    from: "niroshanratnayake07@gmail.com",
    to: email,
    subject: "Password Reset",
    text: "You have successfully reset your pssword",
  
   html:  'Hello  ' + username +' <h1> you have successfully reset your password </h1>'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("send email - " + email);
      console.log("Email sent: " + info.response);
    }
  });
};

exports.mailhandleremailconfirm = (email,username,id) => {
  console.log("sending confirm email ............");
  var mailOptions = {
    from: "niroshanratnayake07@gmail.com",
    to: email,
    subject: "email confirmation",
    //text: "  please visit -http://localhost:4200/active/"+ temporarytoken,
   // html:  'Hello  ' + username +`<h1> please visit -${emailConfirmApi}/${id}  to confirm your email </h1>`
   html:  'Hello  ' + username +' <h1> please visit - <a href="http://localhost:4200/active"> click here </a> to confirm your email </h1>'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("send email - " + email);
      console.log("Email sent: " + info.response);
    }
  });
};

//module.exports = {mailhandlerpasswordreset,mailhandleremailconfirm};
