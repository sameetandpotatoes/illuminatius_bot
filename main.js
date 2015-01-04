var express = require("express");
var app = express();
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

var Bot = require('./bot')
  , config1 = require('./config');

var bot = new Bot(config1);

function shuffleArray(array, callback){
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  callback(array);
}

function datestring () {
  var d = new Date(Date.now() - 5*60*60*1000 - 259200000);  //est timezone
  //now minus 3 days
  return d.getUTCFullYear()   + '-'
     +  (d.getUTCMonth() + 1) + '-'
     +   d.getDate();
};

function removeHTTP(text){
  var newText = '';
  var index = text.indexOf("http://");
  if (index >= 0){
    for (var i = index; i < text.length; i++){
      if (text.substring(i, i+1) == ' '){
        var endIndex = i+1;
        newText = text.substring(0,index) + '' + text.substring(endIndex, text.length - 1);
        break;
      } else if (i == text.length - 1){
        var endIndex = i;
        newText = text.substring(0,index) + '' + text.substring(endIndex, text.length - 1);
        break;
      }
    }
  } else{
    newText = text;
  }
  return newText;
}

function getContext(tweet){
  var array = tweet.split(" 3 ");
  var context = array[0].substring(array[0].lastIndexOf(" ") + 1) + " 3 " + array[1].split(" ")[0];
  return context;
}

setInterval(function(){
    var params = {
        q: '3',
        lang: 'en',
        since: datestring(),
        count: 50,
        result_type: 'mixed'
    };
    bot.twit.get('search/tweets', params, function (err, reply) {
      if(err) return handleError(err);
      var threes = require('./usesofthree');
      var user = '';
      var context = "";
      var tweet_id;
      var length = threes.length;
      shuffleArray(reply.statuses, function(randomized){
        for (var i = 0; i < randomized.length; i++){
          var length = threes.length;
          var text = reply.statuses[i]["text"];
          if (text.indexOf(" 3 ") < 0){
             continue;
          }
          text = removeHTTP(text);
          while (length > 0 && text.indexOf(threes[length-1]) < 0){
            length--;
          }
          if (length == 0){ //Traversed the entire array, didn't find any of those uses
            context = getContext(text);
            user = reply.statuses[i]["user"]["screen_name"];
            tweet_id = reply.statuses[i]["id"];
            break;
          }
        }
        var status = '@' + user + ' ' + context + '?!?! Half Life 3 Confirmed!!!';
        var postparams = {
          status: status,
          in_reply_to_status_id: tweet_id
        }
        bot.twit.post('statuses/update', postparams, function(err,reply){
          if (err) return handleError(err);
          console.log("Tweeted");
        });
      });
    });
}, 450000);

function handleError(err) {
  console.error('response status:', err.statusCode);
  console.error('data:', err.data);
}
