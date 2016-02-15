Installation
=========

1. Clone this repository
2. `touch config.js`
3. Open up config.js, copy the below template, and fill in with your Twitter developer credentials.
4. `npm install`.

        exports.twitterAccess = {
        "consumer_key": '',
        "consumer_secret": '',
        "access_token": '',
        "access_token_secret": ''
        };
        exports.screen_name = "";

Configuration
============

- There are some variables you can change. For instance, to modify tweets and "bad" uses of 3 in tweets,
check out `three_tagline.js` and `usesofthree.js`
- To make sure this bot doesn't get banned, I prevent posting to the same user more than once by storing
their names in a queue. If you implement this bot, make sure you are not spamming users.
- Currently, I post every 7200000 ms (2 hours), but you can change that.

URL
=========
http://www.twitter.com/illuminatius3
