const Orchestrator = require('../orchestrator');
const Utils = require('../utils');
const Player = require('../player');
const Table = require('../table');
const Deck = require('../deck');

// Things that might be different from Game to Game
const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5,
    testMode: false
}

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

/**
 * Poker Endpoints
 */

exports.validate = (req, session) => {
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

exports.viewGame = (req, h) => {
  let game = Utils.getByAttributeValue(Games, "id", parseInt(req.params.gameId));
  let player = getOrCreateUser(req.auth.credentials.user.id);
  Orchestrator.addPlayerToGame(game, player);
  return h.view('game');
}

exports.joinGame = async (req, h) => {
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
}

exports.addPlayer = (req, h) => {
  // Set player at table for first time
  let game = Utils.getByAttributeValue(Games, "id", parseInt(req.params.gameId));
  let player = getOrCreateUser({firstName: "syx", lastName: "afdsn"})
  return {status: 'success', players: Orchestrator.addPlayerToGame(game, player)};
};

exports.bet = (req, h) => {
  let game = getOrCreateGame(req.params.gameId);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'bet', req.query.amount)};
};

exports.call = (req, h) => {
  let game = getOrCreateGame(req.params.gameId);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'call')};
};

exports.check = (req, h) => {
  let game = getOrCreateGame(req.params.gameId);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'check')};
};

exports.fold = (req, h) => {
  let game = getOrCreateGame(req.params.gameId);
  return {status: 'success', data: Orchestrator.receiveAction(game, 'fold')};
};

exports.nextHand = (req, h) => {
  let game = getOrCreateGame(req.params.gameId);
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