/**
 * Created by Administrator on 2018/3/13.
 */
/**
 * Created by Administrator on 2018/3/13.
 */
var mysql=require('mysql');

var conn_pool=mysql.createPool({
    host:"127.0.0.1" ,
    port:3306,
    database:"test",
    user:"root",
    password:"03251222yxn"
});

function mysql_exce(sql,callback){
    conn_pool.getConnection(function (err,conn) {
        if(err){
            if(callback){
                callback(err,null,null);
            }
            return;
        }
        conn.query(sql, function (sql_err,sql_result,fields_desic) {
            if(sql_err){
                if(callback){
                    callback(sql_err,null,null);
                    conn.end();
                }
                return;
            }
            if(callback){
                callback(null,sql_result,fields_desic);
                conn.end();
            }
        });

    });
}
exports.mysql_exce=mysql_exce;
