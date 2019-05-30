var nodemailer = require("nodemailer");
var fs = require('fs');
var jwt = require('jsonwebtoken');
var path = require('path');

var eventService = require('../../service/eventService');
var categoryService = require('../../service/categoryService');
var organizationService = require('../../service/organizationService');
var userService = require('../../service/userService');
var {hash_password,check_password} = require('../../utils/bcrypt');
var smtpTransport = require('../../utils/mail');
var objectDefined = require('../../utils/object_define');

var privateKey  = fs.readFileSync(path.join(__dirname,'../../configs/private.key'), 'utf8');

exports.homePage = async (req, res)=>{
    var events = await eventService.getAllEvents({
        attributes: ['id','name','date','address','img'],
        limit: 4
    });
    
    //get slide img - tạm thời, sau bỏ vô service
    var slides = events.map(obj=>{
        return {'img':obj.img,'name':obj.name};
    });
    var comming_events = await eventService.getCommingEvents();
    var categories = await categoryService.getAllCategories();

    var data = {
        title: 'Tickat - Mua bán vé sự kiện',
        layout: 'main',
        comming_events: comming_events,
        recommend_events: events,
        slides: slides,
        categories:  categories,
        logged: false
    };
    if(typeof req.user !== 'undefined'){
        data.logged = true;
        data.user = req.user;
    }    

    res.render("customer/home",data);
};

exports.about = async (req, res)=>{
    var categories = await categoryService.getAllCategories();
    var id =  req.params.id;
    var organization = await organizationService.findOrganizationById(id);

    var data = {
        title: 'Tickat - '+organization.name,
        layout: 'main',
        organization: organization,
        categories:  categories,
        logged: false
    };
    if(typeof req.user !== 'undefined'){
        data.logged = true;
        data.user = req.user;
    }    
    res.render("customer/about",data);
};

exports.send_email = async (req, res)=>{
    var fullName = req.body.fullName,
        phone = req.body.phone,
        email = req.body.email,
        content = req.body.content,
        id = req.params.id;
    var organization = await organizationService.findOrganizationById(id);
    
    var mailOptions={
        to : organization.mail,
        subject : "Ý kiến từ khách hàng",
        text : `
        From: ${fullName}
        Phone: ${phone}
        Email: ${email}

        ${content}
        ------------------------------------------------------------------------------
        Mail was sent by Tickat.vn
        ${new Date()}
        `
    };
    smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                res.end("Đã xảy ra lỗi. Xin thử lại sau :(");
            }else{
                res.end("Phản hồi của bạn đã được gởi đến nhà tổ chức !");
            }
    });
};


exports.login = async (req, res)=>{
    var username = req.body.username, password = req.body.password;
    var user = await userService.getUserByUsername(username);
    var response ={
        status: 403,
        message: "Invalid username or password !"
    };

    if(user!=null && check_password(password, user.password)){
        var payload = {
            username: user.username,
            full_name: user.full_name,
            avatar: user.avatar,
            role_id: user.role_id
        };

        let token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
        res.cookie('token', token);
        response.status = 200;
        response.message="";
    }
    res.send(response);
};

exports.signUp = async (req, res)=>{
    var data = {
        username :req.body.username,
        password : req.body.password
    };

    data.password = hash_password(data.password);

    userService.createAccount(data);
    res.redirect('/');
};

exports.logout = (req, res)=>{
    res.clearCookie("token");
    res.redirect('/');
};

exports.switchAcc = async (req, res)=>{
    if(typeof req.user !== 'undefined'){
        userService.switchRoleToAdmin(req.user.username);
    }
    res.clearCookie("token");
    res.redirect('/admin/login');
};