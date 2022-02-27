const Orchestrator = require('../orchestrator');
const Utils = require('../utils');
const Player = require('../player');
const Table = require('../table');
const Deck = require('../deck');
const { server } = require('@hapi/hapi');

// Things that might be different from Game to Game
const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5,
    testMode: false
}

function createNewPlayer(userData,repo){
  let newId = repo.length + 1;
  let firstName = userData["firstName"];
  let lastName = userData["lastName"];
  let newPlayer = Player(newId, firstName, lastName);
  repo.push(Player(newId, firstName, lastName));
  return newPlayer;
}

function getOrCreateUser(existingUserData,repo){
  console.log("Get or create user: ", existingUserData);
  if (existingUserData && existingUserData["id"]){
    console.log("we have the data");
    let player = Utils.getByAttributeValue(repo,"id", parseInt(existingUserData["id"]));
    console.log("Found player: ", player);
    if (!player){
      return createNewPlayer(existingUserData,repo);
    } else {
      return player;
    }
  } else {
    return createNewPlayer(existingUserData,repo);
  }
}

function getOrCreateGame(gameId,repo){
    let game = {}
    if (gameId){
      game = Utils.getByAttributeValue(repo, "id", parseInt(gameId));
    }
    if (game === undefined ){
        game = newGame(gameConfig,repo);
    }
    return game;
}

function newGame(gameConfig,repo){
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
      id: repo.length + 1,
      gameCode: "abc",
      players: [],
      table: table,
      deck: deck,
  }

  repo.push(game);

  return game;
}

/**
 * Poker Endpoints
 */

exports.validate = (req, session) => {
  console.log("In validateFunc(). Session user id is: ", session.user.id);

  const user = req.server.app.players.find(
      (user) => (user.id === parseInt(session.user.id))
  );
  
  if (!user) {
      // return false will be 'unauthenticated'
      return { valid: false };
  }

  console.log("Current user is: ", user.id, " ", user.firstName);

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

exports.currentState = (req, h) => {
  let game = Utils.getByAttributeValue(Games, "id", parseInt(req.params.gameId));
  var playersInfo = [];
  game.players.forEach(function(player){
      playersInfo.push({playerId: player.id,
          chips: player.chips,
          name: player.prettyName(),
          actedInStreet: player.actedInStreet,
          button: player.button,
          smallBlind:  player.smallBlind,
          bigBlind: player.bigBlind,
          gameState: player.gameState,
          handState: player.handState
      })
  })
  return {status: 'success', data: {playersInfo: playersInfo}};
}

exports.viewGame = (req, h) => {
  let game = Utils.getByAttributeValue(req.server.app.games, "id", parseInt(req.params.gameId));
  let player = getOrCreateUser({id: req.auth.credentials.user.id},req.server.app.players);
  console.log("UserId: ", player.id, " is joining gameId: ", game.id);
  Orchestrator.addPlayerToGame(game, player);
  return h.view('game');
}

exports.joinGame = async (req, h) => {
  let user = {};

  if (req.auth.credentials && req.auth.credentials.user && req.auth.credentials.user.id){
    user = getOrCreateUser({id: req.auth.credentials.user.id},req.server.app.players);
  } else {
    user = getOrCreateUser({firstName: req.payload.firstName, lastName: req.payload.lastName},req.server.app.players);
  }

  let game = getOrCreateGame(req.payload.gameId,req.server.app.games);

  req.cookieAuth.set({user: {id: user.id}});
  return h.redirect('/game/' + game.id);
}

exports.addPlayer = (req, h) => {
  // Set player at table for first time
  let game = Utils.getByAttributeValue(Games, "id", parseInt(req.params.gameId));
  let player = getOrCreateUser({firstName: "syx", lastName: "afdsn"},req.server.app.players)
  
  console.log("request is: ", req);
  console.log("h is: ", h);
  return {status: 'success', data: Orchestrator.addPlayerToGame(game, player)};
};

exports.bet = (req, h) => {
  let game = getOrCreateGame(req.params.gameId,req.server.app.games);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'bet', req.query.amount)};
};

exports.call = (req, h) => {
  let game = getOrCreateGame(req.params.gameId,req.server.app.games);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'call')};
};

exports.check = (req, h) => {
  let game = getOrCreateGame(req.params.gameId,req.server.app.games);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'check')};
};

exports.fold = (req, h) => {
  let game = getOrCreateGame(req.params.gameId,req.server.app.games);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'fold')};
};

exports.nextHand = (req, h) => {
  let game = getOrCreateGame(req.params.gameId,req.server.app.games);
  return {status: 'success', data: Orchestrator.nextHand(game)};
};

// /**
//  * Get Dog by ID
//  */
// exports.get = (req, h) => {

//   return Dog.findById(req.params.id).exec().then((dog) => {

//     if(!dog) return { message: 'Dog not Found' };

//     return { dog: dog };

//   }).catch((err) => {

//     return { err: err };

//   });
// }


// /**
//  * POST a Dog
//  */
// exports.create = (req, h) => {

//   const dogData = {
//     name: req.payload.name,
//     breed: req.payload.breed,
//     age: req.payload.age,
//     image: req.payload.image
//   };

//   return Dog.create(dogData).then((dog) => {

//      return { message: "Dog created successfully", dog: dog };

//   }).catch((err) => {

//     return { err: err };

//   });
// }

// /**
//  * PUT | Update Dog by ID
//  */
// exports.update = (req, h) => {

//   return Dog.findById(req.params.id).exec().then((dog) => {

//     if (!dog) return { err: 'Dog not found' };

//     dog.name = req.payload.name;
//     dog.breed = req.payload.breed;
//     dog.age = req.payload.age;
//     dog.image = req.payload.image;

//     dog.save(dogData);

//   }).then((data) => {

//       return { message: "Dog data updated successfully" };

//   }).catch((err) => {

//       return { err: err };

//   });
// }

// /**
//  * Delete Dog by ID
//  */
// exports.remove = (req, h) => {

//   return Dog.findById(req.params.id).exec(function (err, dog) {

//     if (err) return { dberror: err };
//     if (!dog) return { message: 'Dog not found' };

//     dog.remove(function (err) {
//       if (err) return { dberror: err };

//       return { success: true };
//     });
//   });
// }