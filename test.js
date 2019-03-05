var async = require('async');
/*
var async = require('async');
var objArr = [];
for(var i = 109; i <= 125; i++){
    objArr.push(i);
}
async.mapSeries(objArr, function(pItemCard, callback2){
    console.log('cardId,cardNum',pItemCard);

    callback2();

}, function(err, res){
})*/

/*

var q = async.queue(function (obj,cb) {
    setTimeout(function () {
        console.log(obj);
        cb();
    },obj.time)
}, 1)
/!*for (var i = 0; i<10; i++) {
    console.log(1);
    q.push({name:i,time:i*1000}, function (err) {
        console.log(err);
    })
};*!/

for (var i = 0; i<10; i++) {
    console.log(2);
    q.push({name:1,time:1000},function (err) {
        console.log(err);
    })
};
q.saturated = function() {
    console.log('all workers to be used');
}

q.empty = function() {
    console.log('no more tasks wating');
}

q.drain = function() {
    console.log('all tasks have been processed');
}*/

var crypto = require('crypto');
/*var timestamp = Date.now();
var msg = 12 + '|' + timestamp;
console.log(msg);
var cipher = crypto.createCipher('aes256', '123123');
var enc = cipher.update(msg, 'utf8', 'hex');
enc += cipher.final('hex');
console.log(enc);*/


var token = '75f5e2e4542bee7b61f676d8d9717d7d41cbdac558b4200d2c41f38f8c4dbbd4';

var decipher = crypto.createDecipher('aes256', '123123');
var dec;
try {
    dec = decipher.update(token, 'hex', 'utf8');
    dec += decipher.final('utf8');
} catch(err) {
    console.error('[token] fail to decrypt token. %j', token);
    return null;
}
var ts = dec.split('|');
if(ts.length !== 2) {
    // illegal token
    return null;
}
console.log({uid: ts[0], timestamp: Number(ts[1])});
