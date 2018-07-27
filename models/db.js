/**
 * Created by Administrator on 2018/3/13.
 */

var mysqlconnect=require('./mysqlconnect.js');
var send=require('./email.js');

exports.getUserData= function (data,callback) {

    var sql="select * from user where name=\'"+data+"\'";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback("没有该用户",null);
        }

        callback(null,sql_result);
    });
};
exports.insertUser= function (data,callback) {

    var mail={
        //发件人
        from:'vincent_wsc@126.com',
        //主题
        subject:'账号激活',
        //收件人
        to:data.email,
        //邮件内容，HTML格式
        text:'点击<html>' +
        '<a href="http://localhost:4000/Activate?name='+data.name+'">激活</a>' +
        '</html>'
    };
    var sql="insert into user(name,password,email) values(\'"+data.name+"\',\'"+data.password+"\',\'"+data.email+"\')";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            console.log(sql_result);
            callback("插入失败",null);
        }
        send(mail);
        callback(null,sql_result);
    })

};
//发送显示账户密码的邮件
exports.sendemailto= function (data,callback) {
    var mail={
        //发件人
        from:'vincent_wsc@126.com',
        //主题
        subject:'账号激活',
        //收件人
        to:data.email,
        //邮件内容，HTML格式
        text:'您的用户密码为：'+data.password
    };
    console.log("data.email="+data.email);
    send(mail);
    callback(null,{"msg":"1"});
}
//
exports.updateData= function (data,callback) {
    console.log(data.id);
    var sql="update user set state=1 where id="+data.id;
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            console.log(sql_result);
            callback("更新失败",null);
        }
        callback(null,sql_result);
    });
};
//更新数据库的用户的密码
exports.updatePassword= function (data,callback) {
    console.log(data.id);
    var sql="update user set password="+ data.password+" where id="+data.id;
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            console.log(sql_result);
            callback("修改失败",null);
        }
        callback(null,sql_result);
    });
};
//获取数据库中用户的浏览记录
exports.getHistory= function (data,callback) {
    console.log(data);
    var sql="select * from history where uid="+data+" order by time desc limit 0,10";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    })
};
//插入到数据中最新的访问时间
exports.insertTime= function (data,callback) {
    var sql="insert into history(uid,time) values(\'"+data.uid+"\',\'"+data.time+"\')";
    mysqlconnect.mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    })
};
