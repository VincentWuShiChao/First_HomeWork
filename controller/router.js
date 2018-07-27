/**
 * Created by Administrator on 2018/3/13.
 */
var db=require('../models/db.js');
var formidable=require('formidable');
var url=require("url");
var qs=require('querystring');
var token=require('../util/TokenUtil');
//心跳
var flag=false;
var endTime=null;
//用户的操作状态

var userState=null;

//存放已经通过登录验证的用户的token信息
var TokenList=[];
//token的有效期
var Token_Validity=60*5;


//用户登录系统后，心跳检测用户是否长时间未操作
function heardbeat(user_name){
    var timer=setInterval(function () {
        findToken_content(user_name,TokenList, function (arg) {
            token.decodeToken(arg, function (err,decode_string) {
                var array_1=decode_string.split("&");
                var array_2=array_1[1].split("=");
                var token_time=array_2[1];
                endTime=new Date().getTime();
                if(endTime-token_time<Token_Validity){
                    flag=true;
                }else {
                    flag=false;
                }
                if(flag==true){
                    userState=true;
                    console.log("用户还在操作中......");
                }else {
                    findToken_tag(user_name,TokenList, function (tag) {
                        TokenList.splice(tag,1);
                        console.log("TokenList:",TokenList);
                        console.log("用户长时间未操作，与服务器已断开连接，请重新登录");
                        userState=false;
                        endTime=null;
                        clearInterval(timer);
                    })
                }
            });
        });
    },1000*Token_Validity);
}
//获取用户是否在操作中（判断用户是否长时间没有操作系统）
exports.getUserState= function (req,res,next) {
    if(userState==true){
        res.json({msg:null});
    }else {
        res.json({msg:1});
    }
    next();
}

//跳转到注册界面，账号初始状态为0，未激活
exports.showLogin= function (req,res) {

    return res.render("login",{
        state:0
    });

};
//判断用户名，密码是否正确.
exports.showHome= function (req,res) {

    var arg=url.parse(req.url).query;
    var name=qs.parse(arg)['name'];
    var password=qs.parse(arg)['password'];
    console.log("into showHome");
    db.getUserData(name, function (err,result) {
        console.log("into getUserData");
        if(result.length==0){
             return  res.json({msg:"用户名不存在"});

        }else {
            console.log(result);
            if(result[0].password==password)
            {
                if(result[0].state==1){
                    return res.json({msg:1});

                }else {
                    return res.json({msg:"用户未激活，请到邮箱激活账户"});
                }

            }else {
                return res.json({msg:"密码不正确"});
            }
        }
    });

};
//缓存用户数据
var ache={
    "count":0,
    //用户列表
    "userlist":[
    ]
};
exports.userlist=ache.userlist;
exports.getTime=function (){
    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    var hour=date.getHours();
    var minute=date.getMinutes();
    var second=date.getSeconds();
    var time=year+"-"+month+"-"+day+"-"+hour+":"+minute+":"+second;
    return time;
};
function nowTime(){
    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    var hour=date.getHours();
    var minute=date.getMinutes();
    var second=date.getSeconds();
    var time=year+"-"+month+"-"+day+"-"+hour+":"+minute+":"+second;
    return time;
}
//跳转到首页
exports.showHomeTo= function (req,res) {

    flag=true;
    var arg=url.parse(req.url).query;
    var name=qs.parse(arg)['name'];
    var time=nowTime();
    db.getUserData(name, function (err,result) {
        var uid=result[0].id;
        token.createToken(name, function (err,token_string) {
            TokenList.push({"id":uid,"name":name,"tokenstring":token_string});
            heardbeat(name);
            db.insertTime({"uid":uid,"time":time}, function (err,data) {
                if(err==null){
                    //console.log("插入时间成功");
                    db.getUserData(name, function (err,result) {
                        var uid=result[0].id;
                        var email=result[0].email;
                        var name=result[0].name;
                        var json={};
                        json={"id":result[0].id,"name":name,"email":email,"time":[]};
                        if(ache.userlist.length!=0){
                            var flag=false;
                            for(var i=0;i<ache.userlist.length;i++){

                                if(uid==ache.userlist[i].id){
                                    flag=true;
                                    console.log("history:"+email);
                                    ache.count=ache.userlist.length;
                                    console.log(TokenList[0].name);
                                    return res.render("home",{userdata:name,"email":email,"count":ache.count,"time":ache.userlist[i].time});

                                }
                            }
                            if(flag==false){
                                db.getHistory(uid, function (err,result) {

                                    for(var i=0;i<result.length;i++){
                                        //console.log(result[i]);
                                        json.time[i]=result[i].time;
                                        if(i==result.length-1){
                                            ache.userlist.push(json);
                                            ache.count=ache.userlist.length;
                                            //console.log("time_len="+json.time.length);
                                            //console.log("userlist_len="+ache.userlist.length);
                                            console.log(TokenList[0].name);
                                            return res.render("home",{userdata:name,"email":email,"count":ache.count,"time":json.time});

                                        }
                                    }
                                });
                            }
                        }else if(ache.userlist.length==0){
                            db.getHistory(uid, function (err,result) {

                                for(var i=0;i<result.length;i++){
                                    //console.log(result[i]);
                                    json.time[i]=result[i].time;
                                    if(i==result.length-1){
                                        ache.userlist.push(json);
                                        ache.count=ache.userlist.length;
                                        console.log(TokenList[0].name);
                                        return res.render("home",{"userdata":name,"email":email,"count":ache.count,"time":json.time});

                                    }
                                }
                            });
                        }
                    });
                }else {
                    console.log("插入时间失败");
                    return;
                }
            });
        });
    });
};
//跳转到注册页面
exports.showRegist= function (req,res) {
    return res.render("regist");
}
//验证用户名是否存在
exports.getVerifyResult= function (req,res) {


    var arg=url.parse(req.url).query;
    var name=qs.parse(arg)['name'];
    //console.log(name);
    if(!name){
        return;
    }else {
        db.getUserData(name, function (err,result) {
            if(result.length==0){
                res.json({"data":"用户名可用"});
                return;
            }else {
                res.json({"data":"用户名已存在"});
                return;
            }
        });
    }
};
exports.getRegistSuccess= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var name=obj['name'];
    var password=obj['password'];
    var email=obj['email'];
   db.insertUser({"name":name,"password":password,"email":email}, function (err,result) {
        if(err==null){
            res.json({"data":"success"});
            return;
        }else {
            res.json({"data":"fail"});

            return;
        }
    })
};

//激活账号，改变账号的状态为1.
exports.activate= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var name=obj['name'];
    //console.log(name);
    db.getUserData(name, function (err,result) {
        //console.log("result:"+result[0].id);
        if(result.length==0){
            console.log("该用户不存在");
            return;
        }else {
            //console.log(result);
            db.updateData({"id":result[0].id,"state":1}, function (err,result) {
                if(err){
                    console.log("激活失败，请联系管理员");
                    return;
                }
                console.log("激活成功");
                res.render("login");

            })
        }


    });

};
exports.form= function (req,res) {

    var form = new formidable.IncomingForm();
    form.uploadDir='./';
    form.parse(req, function(err, fields, files) {
        res.render('login');
    });
};
//退出登录
exports.close= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var name=obj['name'];
    for(var i=0;i<ache.userlist.length;i++){
        if(name==ache.userlist[i].name){
            ache.userlist.splice(i,1);
            res.render('login');
            break;
        }
    }

};

//异步获取在线人数
exports.count= function (req,res) {
    res.json({"count":ache.count});
}

//发送忘记密码请求
exports.forget= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var name=obj['name'];
    db.getUserData(name, function (err,result) {
        if(result.length==0){
            res.json({msg:"请确认正确用户名再找回密码！"});
            return;
        }else {
            var email=result[0].email;
            var password=result[0].password;
            res.json({"email":email,"password":password});
            return;
        }
    });
};

//发送密码到指定邮箱
exports.sendemail= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var email=obj['email'];
    var password=obj['password'];
    //console.log(password+","+email);
    db.sendemailto({"email":email,"password":password}, function (err,result) {
        if(result.msg=="1"){
            res.json({"msg":"1"});
            return;
        }
    });
};

function findToken(name,tokenlist,flag_tag,callback){
    //console.log(tokenlist[0].name);
    if(tokenlist.length>0){
        for(var i=0;i<tokenlist.length;i++){
            /*console.log("name:",name);
             console.log("tokenlist_name:",tokenlist[i].name);*/
            if(name==tokenlist[i].name){
                flag_tag=true;
                break;
            }
        }
    }else {
        flag_tag=false;
    }
    console.log("flag_tag:"+flag_tag);
    callback(flag_tag);
};
function findToken_content(name,tokenlist,callback){
    var arg;
    for(var i=0;i<tokenlist.length;i++){
        if(name==tokenlist[i].name){
            arg=tokenlist[i].tokenstring;
            break;
        }
    }
    callback(arg);
};

function findToken_tag(name,tokenlist,callback){
    var tag;
    for(var i=0;i<tokenlist.length;i++){
        if(name==tokenlist[i].name){
            tag=i;
            break;
        }
    }
    callback(tag);
};

//跳转到修改密码页面
exports.change= function (req,res) {
   /* beginTime=new Date().getTime();
    console.log("beginTime:"+beginTime);*/
    var arg=url.parse(req.url).query;
    //console.log("arg:"+arg);
    var obj=qs.parse(arg);
    var name=obj['name'];
    var count=obj['count'];
    var flag_token=false;
    //console.log("change:"+TokenList[0].name);

    findToken(name,TokenList,flag_token, function (flag_tag) {
        if(flag_tag){
            findToken_tag(name,TokenList, function (tag) {
                console.log("oldTokenTime:"+TokenList[tag].tokenstring);
                token.createToken(name, function (err,token_string) {
                    TokenList[tag].tokenstring=token_string;
                    console.log("newTokenTime:"+token_string);
                    res.render("changePassword",{"name":name,"count":count});
                });
            });
        }else {
            res.render("illegal_err");
        }
    });

    //console.log("name:"+name+"\t"+"count:"+count);

};
//确认修改密码
exports.firmChange= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var name=obj['name'];
    var password=obj['password'];
    //console.log("name:"+name+"password:"+password);
    var flag_token=false;
    //console.log("change:"+TokenList[0].name);

    findToken(name,TokenList,flag_token, function (flag_tag) {
        if(flag_tag){
            findToken_tag(name,TokenList, function (tag) {
                console.log("oldTokenTime:"+TokenList[tag].tokenstring);
                token.createToken(name, function (err,token_string) {
                    TokenList[tag].tokenstring=token_string;
                    console.log("newTokenTime:"+token_string);
                    db.getUserData(name, function (err,result) {
                        //console.log("result:"+result[0].id);
                        if(result.length==0){
                            console.log("该用户不存在");
                            return;
                        }else {
                            db.updatePassword({"id":result[0].id,"password":password}, function (err,result) {
                                if(err){
                                    console.log("修改失败，请联系管理员");
                                    return;
                                }
                                console.log("修改成功");
                                res.render("login");

                            })
                        }
                    });
                });
            });
        }else {
            res.render("illegal_err");
        }
    });


};
//进入聊天大厅
exports.intoChat= function (req,res) {
    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    var name=obj['name'];
    var flag_token=false;
    //console.log("change:"+TokenList[0].name);
    findToken(name,TokenList,flag_token, function (flag_tag) {
        if(flag_tag){
            findToken_tag(name,TokenList, function (tag) {
                console.log("oldTokenTime:"+TokenList[tag].tokenstring);
                token.createToken(name, function (err,token_string) {
                    TokenList[tag].tokenstring=token_string;
                    console.log("newTokenTime:"+token_string);
                    res.render("chat_hall",{name:name});
                    });
                });
        }else {
            res.render("illegal_err");
        }
    });


};
//进入聊天室
var userList=[];

exports.chat_room= function (req,res) {

    var arg=url.parse(req.url).query;
    var obj=qs.parse(arg);
    console.log(obj);
    //console.log("change:"+TokenList[0].name);
    if(obj['name']==null){
        res.render("illegal_err");
    }else {
        var name=obj['name'];
        var number=obj['number'];
        var flag_token=false;
        findToken(name,TokenList,flag_token, function (flag_tag) {
            if(flag_tag){
                findToken_tag(name,TokenList, function (tag) {
                    console.log("oldTokenTime:"+TokenList[tag].tokenstring);
                    token.createToken(name, function (err,token_string) {
                        TokenList[tag].tokenstring=token_string;
                        console.log("newTokenTime:"+token_string);
                        userList.push(name);
                        res.render("chat_room",{name:name,number:number,userList:userList});
                    });
                });
            }else {
                res.render("illegal_err");
            }
        });
    }


};