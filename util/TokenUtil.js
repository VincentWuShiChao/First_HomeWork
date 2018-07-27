/**
 * Created by Administrator on 2018/3/23.
 */
const CODINGTYPE='base64';
exports.createToken= function (data,callback) {
    data=data+"&time="+new Date().getTime();
    var buf=new Buffer(data);
    var token_string=buf.toString(CODINGTYPE);
    callback(null,token_string);
};

exports.decodeToken= function (data,callback) {
    var buf=new Buffer(data,CODINGTYPE);
    var decode_string=buf.toString();
    callback(null,decode_string);
};

exports.token_user_illea