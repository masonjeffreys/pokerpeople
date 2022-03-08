const Orchestrator = require('../orchestrator');
const Utils = require('../utils');
const Table = require('../table');
const Deck = require('../deck');
const Repo = require('../repo');

// Things that might be different from Game to Game
const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5,
    testMode: false
}

/**
 * Poker Endpoints
 */

exports.joinGame = async (req, h) => {
  // The post request that creates a user and a game
  let user = {};
  let gameCode = req.payload.gameCode.toLowerCase().replace(/\s/g, '');

  if (req.auth.credentials && req.auth.credentials.user && req.auth.credentials.user.id){
    user = Repo.getOrCreateUser({id: req.auth.credentials.user.id}, req.server.app.users);
  } else {
    user = Repo.getOrCreateUser({firstName: req.payload.firstName, lastName: req.payload.lastName},req.server.app.users);
  }

  let game = Repo.getGame(gameCode, req.server.app.games);
  if(!game){
    game = Repo.createGame(Deck(), Table(), gameConfig, gameCode, req.server.app.games);
  }

  req.cookieAuth.set({user: {id: user.id}});
  return h.redirect('/game/' + game.gameCode);
}

exports.viewGame = (req, h) => {
  // Retrieve player and game and add player to game
  // Render main game play view
  let game = Utils.getByAttributeValue(req.server.app.games, "gameCode", req.params.gameCode);
  let player = Repo.getOrCreateUser({id: req.auth.credentials.user.id}, req.server.app.users);
  console.log("UserId: ", player.id, " is joining gameId: ", game.id);
  Orchestrator.addPlayerToGame(game, player);
  return h.view('game', null, {layout: 'minimal'});
}

/// Replaced all the below with websockets calls
// exports.bet = (req, h) => {
//   let game = Repo.getGame(req.params.gameCode,req.server.app.games);
//   return {status: 'success', data: Orchestrator.receiveAction(game, 'bet', req.query.amount)};
// };

// exports.call = (req, h) => {
//   let game = Repo.getGame(req.params.gameCode,req.server.app.games);
//   return {status: 'success', data: Orchestrator.receiveAction(game, 'call')};
// };

// exports.check = (req, h) => {
//   let game = Repo.getGame(req.params.gameCode,req.server.app.games);
//   return {status: 'success', data: Orchestrator.receiveAction(game, 'check')};
// };

// exports.fold = (req, h) => {
//   let game = Repo.getGame(req.params.gameCode,req.server.app.games);
//   return {status: 'success', data: Orchestrator.receiveAction(game, 'fold')};
// };

// exports.nextHand = (req, h) => {
//   let game = Repo.getGame(req.params.gameCode,req.server.app.games);
//   return {status: 'success', data: Orchestrator.nextHand(game)};
// };

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