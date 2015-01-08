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
}

function cleanTweet(text){
  var nohttp = removeFilter("http://", text);
  var nohash = removeFilter("#", nohttp);
  var nomention = removeFilter("@", nohash);
  var noapost = removeFilter("'", nomention);
  var nocarrot = removeFilter("^", noapost);
  var final = nocarrot;
  return final;
}


function getContext(tweet){
  var array = tweet.split(" 3 ");
  var context = array[0].substring(array[0].lastIndexOf(" ") + 1) + " 3 " + array[1].split(" ")[0];
  return context;
}

function getUsersTweets(query, callback){
  var tweets = [];
  bot.twit.get('statuses/user_timeline', {screen_name: "halflifescouter", count: 1000},
    function (err, res){
      if (err){
        handleError(err);
      } else{
        for (var i = 0; i < res.length; i++){
          tweets.push(res[i]["text"]);
        }
        callback(tweets);
      }
    });
}

function removeFilter(query, text){
  var newText = text;
  var index = text.indexOf(query);
  while (index >= 0){
    for (var i = index; i < text.length; i++){
      if (text.substring(i, i+1) == ' ' ||
          (query == "@" && (text.substring(i, i+1) == ':' || text.substring(i, i+1) == ',')) ||
          (query == "'" && i != index && (text.substring(i, i+1) == "'"))){
        var endIndex = i+1;
        newText = text.substring(0,index) + '' + text.substring(endIndex, text.length);
        text = newText;
        break;
      } else if (i == text.length - 1){
        var endIndex = i;
        newText = text.substring(0,index) + '' + text.substring(i+1, text.length);
        text = newText;
        break;
      }
    }
    index = text.indexOf(query);
  }
  return text;
}

setInterval(function(){
    console.log("Bot started");
    var tweets;
    getUsersTweets("", function(prevTweets){
      tweets = prevTweets;
      console.log("Obtained users tweets");
      var params = {
          q: '3',
          lang: 'en',
          since: datestring(),
          count: 75,
          result_type: 'mixed'
      };
      bot.twit.get('search/tweets', params, function (err, reply) {
        if(err) return handleError(err);
        console.log("Searched all tweets for 3");
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

            //Check previous tweets
            var j = 0;
            while (j < tweets.length && tweets[j].indexOf(reply.statuses[i]["user"]["screen_name"]) < 0)
              j++;
            if (j < tweets.length){
              continue;
            }
            console.log("Original: " + text);
            text = cleanTweet(text);
            console.log("Cleaned: " + text);
            while (length > 0 && text.indexOf(threes[length-1]) < 0){
              length--;
            }
            if (length == 0){ //Traversed the entire array, didn't find any of those uses
              console.log("Found a good tweet: " + text);
              context = getContext(text);
              user = reply.statuses[i]["user"]["screen_name"];
              tweet_id = reply.statuses[i]["id"];
              break;
            }
          }
          var status = '@' + user + ' ' + context + "?! Half Life 3, Portal 3, Dota 3, Team Fortress 3: They're ALL confirmed!";
          var postparams = {
            status: status,
            in_reply_to_status_id: tweet_id
          }
          bot.twit.post('statuses/update', postparams, function(err,reply){
            if (err){
              return handleError(err);
            }
            else {
              console.log("Tweeted " + status);
            }
          });
        });
      });
    });
// }, 10000);
}, 500000);

function handleError(err) {
  console.error('ERROR response status:', err.statusCode);
  console.error('ERROR data:', err.data);
}
