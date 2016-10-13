/* jshint esversion:6 */

const io = require('socket.io')(3005);
const Twitter = require('node-tweet-stream');
const stream = new Twitter(require('./config.json'));

const match = (d, string) => {
  const regex = new RegExp(string, 'i');

  return (d.quoted_status && d.quoted_status.text.match(regex)) ||
    (d.retweeted_status && d.retweeted_status.text.match(regex)) ||
    (d.extended_tweet && d.extended_tweet.full_text.match(regex)) ||
    d.text.match(regex);
};

const type = (d) => {
  if (match(d, 'trump')) {
    return (match(d, 'hillary')) ? 'both' : 'trump';
  }
  else if (match(d, 'hillary')) {
    return 'hillary';
  }
  else {
    return undefined;
  }
};

const tracker = {};

io.on('connection', () => {
  stream.on('tweet', (tweet) => {
    if (tracker[tweet.id]) {
      return;
    }

    const t = type(tweet);

    if (t) {
      tracker[tweet.id] = true;
      io.emit('tweet', Object.assign(tweet, {
        type: t
      }));
    }
  });

  stream.on('error', (error) => {
    io.emit('error', error);
  });

  stream.language('en');
  stream.track('trump');
  stream.track('hillary');
});
