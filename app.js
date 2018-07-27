/**
 * Created by Administrator on 2018/3/13.
 */
var express=require('express');
var app=express();
var router=require('./controller/router.js');
var chat_server=require('./controller/chat_server.js');

app.set("view engine",'ejs');

//路由中间件
app.use(express.static("./public"));

app.get("/GetUserState",router.getUserState);

app.get('/',router.showLogin);
app.get('/Home',router.showHome);
app.get('/HomeTo',router.showHomeTo);
app.get('/regist',router.showRegist);
app.get('/verify',router.getVerifyResult);
app.get('/RegistMail',router.getRegistSuccess);
app.get('/Activate',router.activate);
app.post('/form',router.form);
app.get('/close',router.close);
app.get('/count',router.count);
app.get('/forget',router.forget);
app.get('/sendemail',router.sendemail);
app.get('/changepassword',router.change);
app.get('/firmChange',router.firmChange);
app.get("/into_chat",router.intoChat);
app.get('/chat_room',router.chat_room);

app.use(function (req,res) {
    return res.render("err");
});
chat_server.connect_chat_room();
app.listen(4000);