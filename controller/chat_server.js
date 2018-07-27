/**
 * Created by Administrator on 2018/3/20.
 */
/**
 * Created by Administrator on 2018/3/20.
 */
const WebSocket=require('ws');
const router=require('./router.js');



exports.connect_chat_room= function () {
    var number;
    const wss=new WebSocket.Server({
        port:3000,
        verifyClient:socketVerify
    });
    function socketVerify(info){
        console.log(info.origin);
        console.log(info.req.url);
        number=info.req.url.split("=")[1];
        console.log(number);
        return true;
    }

    var user={};
    var roomid=0;
    var roomInfo=[{"roomid":0,"chat_user_list":[],"count":0,"message_list":[]}];//{roomid:roomid,chat_user_list,count};

    /**
     * mag:
     * 0  获取用户名
     *
     */
    wss.broadcast= function broadcast(s,ws,room_info) {
        wss.clients.forEach(function each(client) {
            console.log("name:"+ws.name);
            if(room_info.chat_user_list!=null){
                if(s==1){
                    console.log(ws.name+":"+ws.msg);
                    client.send(ws.name+":"+ws.msg+":"+room_info.chat_user_list+":"+room_info.count+":"+room_info.roomid);
                    console.log("room_info.chat_user_list:"+room_info.chat_user_list);
                }
                if(s==0){
                    room_info.message_list.push(ws.name+":退出聊天室");
                    client.send(ws.name+":1:"+room_info.chat_user_list+":"+room_info.count+":"+room_info.roomid);
                }
            }else {
            }


        })
    };

    //初始化
    wss.on('connection', function (ws) {

        roomid=0;
        roomid=number;
        ws.send('getname:'+roomid);
        var flag_connection=false;
        var history_message;
        for(var i=0;i<roomInfo.length;i++){
            if(roomInfo[i].roomid==roomid){
                flag_connection=true;
                history_message=roomInfo[i].message_list;
                break;
            }
        }
        if(flag_connection==false){
            roomInfo.push({"roomid":roomid,"chat_user_list":[],"count":0,"message_list":[]});
            history_message=[];
        }
        //count+=1;
        if(history_message!=null){
            ws.send('getHistory@'+history_message+"@"+roomid);
        }
        //发送信息
        ws.on('message', function (jsonStr,flags) {

            var obj=eval('('+jsonStr+')');
            user=obj;
            if(user.msg=="0"){
                for(var i=0;i<roomInfo.length;i++){
                    if(user.roomid==roomInfo[i].roomid){
                        roomInfo[i].chat_user_list.push(user.name);
                        roomInfo[i].count+=1;
                        wss.broadcast(1,user,roomInfo[i]);
                        break;
                    }
                }
            }else {
                console.log("user.msg:"+user.msg);
                for(var i=0;i<roomInfo.length;i++){
                    if(user.roomid==roomInfo[i].roomid){
                        roomInfo[i].message_list.push(user.name+":"+user.msg);
                        wss.broadcast(1,user,roomInfo[i]);
                        break;
                    }
                }
            }
        });
        //退出聊天
        ws.on('close', function (close) {
            try{
                for(var i=0;i<roomInfo.length;i++){
                    if(roomid==roomInfo[i].roomid){
                        roomInfo[i].count-=1;
                        for(var a=0;a<roomInfo[i].chat_user_list.length;a++){
                            if(roomInfo[i].chat_user_list[a]==user.name){
                                roomInfo[i].chat_user_list.splice(a,1);
                            }
                        }
                        wss.broadcast(0,user,roomInfo[i]);
                        break;
                    }
                }
            }catch (e){
                console.log("刷新页面");
            }
        });
    });

};


