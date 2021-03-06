var express = require("express");
var Twit = require('twit');
var app = express();
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

var config = require('./config');
var noThrees = require('./usesofthree');
var threeTagLine = require('./three_tagline');
var last_users_queue = [];
var day_in_ms = 86400000;
var bot = new Twit(config.twitterAccess);
var queue_max = 100;

//Get a random tag line
function getTagLine(){
  return threeTagLine[Math.floor(Math.random() * threeTagLine.length)];
}
//Get last tweets of the user so I don't post to the same person
function getLastTweets(callback){
  bot.get('statuses/user_timeline', {screen_name: config.screen_name, count: queue_max}, function(err, res){
    for (var i = 0; i < res.length; i++){
      var tweet = res[i];
      last_users_queue.push(tweet.in_reply_to_screen_name);
    }
    callback(last_users_queue);
  });
}

//Get a date string of the last three days to search Twitter
function datestring (days) {
  var new_date = Date.now() - (day_in_ms * days);
  var d = new Date(new_date);
  return d.getUTCFullYear()   + '-'
     +  (d.getUTCMonth() + 1) + '-'
     +   d.getDate();
}
//Remove all instances of various characters that I do not want to retweet
function cleanTweet(text){
  var nohttp = removeFilter("http://", text);
  var nohash = removeFilter("#", nohttp);
  var nomention = removeFilter("@", nohash);
  var noapost = removeFilter("'", nomention);
  var nocarrot = removeFilter("^", noapost);
  var final = nocarrot;
  return final;
}

//Context is the word before and after the three
function getContext(tweet){
  var array = tweet.split(" 3 ");
  var before3 = (array[0] != null) ? array[0].substring(array[0].lastIndexOf(" ") + 1) : "";
  var after3 = (array[1] != null) ? array[1].split(" ")[0] : "";
  return before3 + " 3 " + after3;
}
//Removes all instances of 'query' from 'text'
function removeFilter(query, text){
  var newText = text;
  var index = text.indexOf(query);
  //While there are no more instances of query in text
  while (index >= 0){
    for (var i = index; i < text.length; i++){
      //if the next character is one of the following
      if (text.substring(i, i+1) == ' ' ||
          (query == "@" && (text.substring(i, i+1) == ':' || text.substring(i, i+1) == ',')) ||
          (query == "'" && i != index && (text.substring(i, i+1) == "'"))){
        //remove the text from the string, and update the text variable
        var endIndex = i+1;
        newText = text.substring(0,index) + '' + text.substring(endIndex, text.length);
        text = newText;
        break;
      } else if (i == text.length - 1){ //if we reached the end of the string, same idea
        var endIndex = i;
        newText = text.substring(0,index) + '' + text.substring(i+1, text.length);
        text = newText;
        break;
      }
    }
    //Look to see if there are any more instances of query
    index = text.indexOf(query);
  }
  return text;
}
function find_three_tweet(days, callback){
  var found_tweet = false;
  var tweet = "";
  var params = {
      q: '3',
      lang: 'en',
      since: datestring(days),
      count: 75,
      result_type: 'mixed'
  };
  bot.get('search/tweets', params, function (err, reply) {
    //'Uses of three' contains all of the bad uses for '3' which I don't
    //want to retweet
    var user = '';
    var context = "";
    var tweet_id;
    var length = noThrees.length;
    for (var i = 0; i < reply.statuses.length; i++){
      var status = reply.statuses[i];
      if (last_users_queue.indexOf(status["user"]["screen_name"]) >= 0){
        continue;
      }
      var text = status["text"];
      //If no three present in the tweet, move on
      if (text.indexOf(" 3 ") < 0){
         continue;
      }
      var text = cleanTweet(text);
      //Make sure no improper uses of three are evident
      while (length > 0 && text.indexOf(noThrees[length-1]) < 0){
        length--;
      }
      //Traversed the entire array, didn't find any of those uses
      if (length == 0){
        context = getContext(text);
        user = status["user"]["screen_name"];
        tweet_id = status["id"];
        status = '.@' + user + ' ' + context + "? " + getTagLine() + " too...Illuminati Confirmed!"
        last_users_queue.push(user);
        if (last_users_queue.length > queue_max){
          last_users_queue.shift();
        }
        found_tweet = true;
        break;
      }
    }
    if(found_tweet){
      callback(status);
    } else{
      days++;
      console.log("Couldn't find a tweet.. Increasing days" + days);
      find_three_tweet(days, function(tweet){
      });
    }
  });
}

getLastTweets(function(queue){
  last_users_queue = queue;
  console.log("Got previous users");
  // The repetition part of the program starts here
  setInterval(function(){
    console.log("Bot started");
    find_three_tweet(3, function(status){
      bot.post('statuses/update', { status: status }, function(){
        console.log("Tweeted " + status);
      });
    });
  }, 7200000);
});
