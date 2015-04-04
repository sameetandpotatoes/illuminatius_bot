var express = require("express");
var app = express();
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

var Bot = require('./bot')
  , config1 = require('./config');

var bot = new Bot(config1);
var threes = require('./usesofthree');

//Get a date string of the last three days to search Twitter
function datestring () {
  var d = new Date(Date.now() - 5*60*60*1000 - 259200000);  //est timezone
  //now minus 3 days
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
  var context = array[0].substring(array[0].lastIndexOf(" ") + 1) + " 3 " + array[1].split(" ")[0];
  return context;
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
// The repetition part of the program starts here
setInterval(function(){
    console.log("Bot started");
      //Search twitter for recent tweets for '3'
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
      //'Uses of three' contains all of the bad uses for '3' which I don't
      //want to retweet
      var user = '';
      var context = "";
      var tweet_id;
      var length = threes.length;
      for (var i = 0; i < reply.statuses.length; i++){
        var length = threes.length;
        var text = reply.statuses[i]["text"];
        //If no three present, move on
        if (text.indexOf(" 3 ") < 0){
           continue;
        }
        console.log("Original: " + text);
        text = cleanTweet(text);
        console.log("Cleaned: " + text);
        //Make sure no improper uses of three are evident
        while (length > 0 && text.indexOf(threes[length-1]) < 0){
          length--;
        }
        //Traversed the entire array, didn't find any of those uses
        if (length == 0){
          console.log("Found a good tweet: " + text);
          context = getContext(text);
          user = reply.statuses[i]["user"]["screen_name"];
          tweet_id = reply.statuses[i]["id"];
          break;
        }
      }
      var status = '@' + user + ' ' + context + "?! Number of sides in a triangle is 3 too...Illuminati Confirmed!";
      var postparams = {
        status: status,
        in_reply_to_status_id: tweet_id
      }
      bot.twit.post('statuses/update', postparams, function(err,reply){
        if (err){
          console.log("Couldn't post " + status);
          return handleError(err);
        }
        else {
          console.log("Tweeted " + status);
        }
      });
    });
}, 43200000);

//Posts more error data for debugging
function handleError(err) {
  console.error('ERROR response status:', err.statusCode);
  console.error('ERROR data:', err.data);
  console.error(err);
}
