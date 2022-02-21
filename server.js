'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');
const Player = require('./src/player');
const Table = require('./src/table');
const Deck = require('./src/deck');
const Utils = require('./src/utils');
const Bcrypt = require('bcrypt');
const Socket = require("socket.io");

// Until we have a DB, we will store games here in memory, get the right game, update state, and store again.
let Games = [
    // {id: 1,
    // gameCode: "abc",
    // players: [Player(1, "Dealer"), Player(2, "SmBnd"), Player(3, "LgBnd"), Player(4, "Jeff Mason")],
    // table: Table(1),
    // deck: Deck(1)}
  ]
  
  // Until we have a DB, we will store list of player here in memory, get the right player, update player, etc.
  let Players = [
    // Player(1, "Dealer")
  ]

  // Things that might be different from Game to Game
    const gameConfig = {
        startingChips: 100,
        smallBlindAmount: 5,
        testMode: false
    }

  function createNewPlayer(userData){
    let newId = Players.length;
    let firstName = userData["firstName"];
    let lastName = userData["lastName"];
    let newPlayer = Player(newId, firstName, lastName);
    Players.push(Player(newId, firstName, lastName));
    return newPlayer;
  }
  
  function getOrCreateUser(existingUserData){
    console.log("Made it here: ", existingUserData);
    if (existingUserData && existingUserData["id"]){
      let player = Utils.getByAttributeValue(Players, "id", parseInt(existingUserData["id"]));
      console.log("Found player: ", player);
      if (!player){
        return createNewPlayer(existingUserData);
      } else {
        return player;
      }
    } else {
      return createNewPlayer(existingUserData);
    }
  }

  function getOrCreateGame(gameId){
      console.log("madeitHere: ", gameId);
      let game = {}
      if (gameId){
        game = Utils.getByAttributeValue(Games, "id", parseInt(gameId));
      }
      console.log("currently, game is: ", game);
      if (game == undefined ){
          // No id given or game id didn't match
          console.log("no game found. Time to create one!")
          game = newGame(gameConfig);
      }
      return game;
  }

  function newGame(gameConfig){
    // Create a deck and table
    // Set up 'initial start' params (things that aren't done on every hand) for table
    // Set table blind levels
    // Return game object
    console.log("creating new game");
    let deck = Deck(1);
    let table = Table(1);

    table.dealerPosition = -1; // We will advance this to 0 when the hand is setup
    table.smallBlind = gameConfig["smallBlindAmount"];
    table.bigBlind = 2 * gameConfig["smallBlindAmount"];
    table.startingChips = gameConfig["startingChips"];

    let game = {
        id: Games.length + 1,
        gameCode: "abc",
        players: [],
        table: table,
        deck: deck,
    }

    Games.push(game);
    return game;
}

// const validate = async (request, username, password, h) => {
//     //await console.log("Here!");
//     console.log("username is: ", username);
//     console.log("password is: ", password);
//     const user = exampleUsers[username];
//     if (username === 'help') {
//         return { response: h.redirect('https://hapijs.com/help') };     // custom response
//     }
//     if (!user) {
//         console.log("No user exists by username: ", username);
//         return { credentials: null, isValid: false };
//     }

//     const isValid = await Bcrypt.compare(password, user.password);
//     console.log("Is valid? ", isValid);
//     const credentials = { id: user.id, name: user.name };

//     return { isValid, credentials };
// };

exports.init = async function () {

    const server = Hapi.server({
        port: 8080,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    });

    const context = {
        title: 'Poker Pig',
        message: 'Bring home the bacon for charity'
    };

    await server.initialize();
    await server.register(Vision);
    await server.register(Inert);
    await server.register(require('@hapi/cookie')); // use for login/logout

    const io = Socket(server.listener)

    io.on('connection', (socket) => {
        let roomName = socket.handshake.query;
        socket.join(roomName);
        socket.on('chat message', (msg) => {
            console.log("chat message received: ", msg, socket.handshake.query.gameId);
            io.to(roomName).emit('chat message', msg);
        });
        socket.on('disconnect', () => {
          console.log('user disconnected');
        });
    });

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates',
        layout: 'layout',
        layoutPath: 'templates',
        context
    });

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'sid-example',
            password: '!wsYhFA*C2U6nz=Bu^%A@^F#SF3&kSR6',
            isSecure: false
        },
        redirectTo: '/unauthenticated',
        // Subsequent requests containing the session cookie are authenticated 
        // and validated via the provided validateFunc in case the cookie's
        // encrypted content requires validation on each request.

        // This doesn't set the cookie, just allows the route to proceed or not, reads the existing
        // session information, and sets that information as credentials on the request

        // Function is only called if session information exists
        
        validateFunc: (req, session) => {
            console.log("In validateFunc(). Session user id is: ", session.user.id);

            const user = Players.find(
                (user) => (user.id === parseInt(session.user.id))
            );
            
            console.log("Current user is: ", user);
            if (!user) {
                // return false will be 'unauthenticated'
                return { valid: false };
            }

            // credentials object will now be available as req.auth.credentials
            
            return { valid: true,
                credentials: {
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
            }
        }
    });

    server.auth.default('session');
    
    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: {
                mode: 'try' // We'll use the validateFunc to set user info if session/cookie data exists
            }
        },
        handler: (req, h) => {
            console.log("Credentials are: ", req.auth.credentials);
            let user = {}
            if (req.auth.credentials && req.auth.credentials.user){
                user = req.auth.credentials.user;
            } else {
                user = {
                    firstName: "first name",
                    lastName: "last name"
                }
            }
            return h.view('home', {
                user: user
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/joinGame',
        handler: async (req, h) => {
            console.log("Payload here is: ", req.payload);
            console.log("Credentials here are: ", req.auth.credentials);
          
            let user = {};
            if (req.auth.credentials && req.auth.credentials.user && req.auth.credentials.user.id){
              user = getOrCreateUser(req.auth.credentials.user.id);
            } else {
              user = getOrCreateUser({firstName: req.payload.firstName, lastName: req.payload.lastName});
            }

            let game = getOrCreateGame(req.payload.gameId);

            req.cookieAuth.set({user: {id: user.id}});
            return h.redirect('/game/' + game.id);
        },
        options: {
            // for auth here, we will 'try' and then create a new user if one doesn't exist
            auth: {
                mode: 'try'
            },
            // validate: {
            //     payload: Joi.object({
            //         firstName: Joi.string().required(),
            //         lastName: Joi.string().required(),
            //         gameId: Joi.string().required()
            //     })
            // }
        }
    });

    server.route({
        method: 'POST',
        path: '/newGame',
        handler: GameController.newGame,
        options: {
            auth: {
                mode: 'try'
            },
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().min(1).max(140).required(),
                    lastName: Joi.string().min(1).max(140).required()
                })
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/game/{gameId}',
        options: {
            auth: false
        },
        handler: (req, h) => {
            return h.view('game');
        }
    });

    server.route({
        method: 'GET',
        path: '/api/addPlayer/{gameId}',
        handler: GameController.addPlayer
    });
    
    server.route({
        method: 'GET',
        path: '/api/new',
        handler: GameController.new
    });

    server.route({
        method: 'GET',
        path: '/api/nextHand/{gameId}',
        handler: GameController.nextHand
    });
    
    server.route({
        method: 'GET',
        path: '/api/call/{gameId}',
        handler: GameController.call
    });
    
    server.route({
        method: 'GET',
        path: '/api/bet/{gameId}',
        handler: GameController.bet
    });
    
    server.route({
        method: 'GET',
        path: '/api/fold/{gameId}',
        handler: GameController.fold
    });
    
    server.route({
        method: 'GET',
        path: '/api/check/{gameId}',
        handler: GameController.check
    });

    ///////////////
    // Begin routes for static files and error handling
    ///////////////

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/img/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public/img'),
                listing: true
            }
        }
    });

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/css/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public/css'),
                listing: true
            }
        }
    });

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/js/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public/js'),
                listing: true
            }
        }
    });

    server.route({
        method: '*',
        path: '/{any*}',
        options: {
            auth: false
        },
        handler: function (request, h) {

            return '404 Error! Page Not Found!';
        }
    });

    return server;
};

exports.start = async function (server) {
    await server.start();
    console.log('Server running on %s', server.info.uri);
    return server;
}


// Error Handling
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});