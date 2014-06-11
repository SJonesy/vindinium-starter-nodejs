#!/usr/bin/env node
var request   = require('request')
  , qs        = require('qs')
  , randomBot = require('./bot');


var argv = process.argv;
if (argv.length < 5) {
  usage();
  process.exit(1);
}

var key = argv[2]
  , mode = argv[3]
  , numberOfGames = parseInt(argv[4], 10)
  , numberOfTurns = 300
  , serverUrl = argv[5] || 'http://vindinium.org'
  , i = 0;

if (mode === 'training') {
  numberOfGames = 1;
  numberOfTurns = parseInt(argv[4], 10);
}

playGame();

function playGame() {
  start(serverUrl, key, mode, numberOfTurns, randomBot, function() {
    console.log('Game Finished:', i + 1, '/', numberOfGames);
    i++;
    if (i < numberOfGames) {
      playGame();
    }
  });
}

function start(serverUrl, key, mode, numTurns, bot, cb) { 
  var state;

  if (mode === 'arena') {
    console.log('Connected and waiting for other players to join...');
  }

  getNewGameState(serverUrl, key, mode, numTurns, function (err, state) {
    if (err) {
      console.log("ERROR starting game:", err);
      return cb();
    }

    console.log('Playing at:', state['viewUrl']);

    loop(key, state, bot, cb);
  });
}

function getNewGameState (serverUrl, key, mode, numTurns, cb) {

  var apiEndpoint = mode === 'training' ? '/api/training' : '/api/arena'
    , params      = { key: key }
    , req         = { 
                      url: serverUrl + apiEndpoint,
                      body: qs.stringify(params),
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
                    };

  if (mode === 'training') { params.turns = numTurns; }

  request.post(req, function (err, res, body) {
    if (err || res.statusCode !== 200 ) {
      cb(err || "Unable to start new game status code: " + res.statusCode + " " + body);
    } else {
      cb(null, JSON.parse(new Buffer(body, 'utf8').toString('utf8')));
    }
  });

}

function loop (key, state, bot, cb) {
  var url = state['playUrl'];

  if (isFinished(state)) {
    cb();
  } 
  else {
    bot(state, function (dir) {
      state = move(url, key, dir, function(err, newState) {
        if (err) {
          console.log('ERROR:', err);
          cb();
        } 
        else {
          loop(key, newState, bot, cb);
        }
      });
    });
  }
}

function isFinished (state) {
  return   state 
        && !!state.game 
        && state['game']['finished'] === true;
}

function move (url, key, direction, cb) {
  var req = {
    url: url,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs.stringify({ key: key, dir: direction })
  };

  request.post(req, function (err, res, body) {
    if (err || 200 !== res.statusCode) {
      cb(err || 'Unable to move status code:' + res.statusCode + ' ' + body);
    } else {
      cb(null, JSON.parse(new Buffer(body, 'utf8').toString('utf8')));
    }
  });
}

function usage () {
  console.log('Usage: client.js <key> <[training|arena]> <number-of-games|number-of-turns> [server-url]');
  console.log('Example: client.js mySecretKey training 20');
}

function board (board) {

}