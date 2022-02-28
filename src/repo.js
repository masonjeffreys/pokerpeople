const Utils = require('./utils');
const Player = require('./player');

function createUser(userData, repo){
    let newId = repo.length + 1;
    let firstName = userData["firstName"];
    let lastName = userData["lastName"];
    let newPlayer = Player(newId, firstName, lastName);
    repo.push(Player(newId, firstName, lastName));
    return newPlayer;
  }
  
  function getOrCreateUser(existingUserData, repo){
    console.log("Get or create user: ", existingUserData);
    if (existingUserData && existingUserData["id"]){
      console.log("we have the data");
      let player = Utils.getByAttributeValue(repo,"id", parseInt(existingUserData["id"]));
      console.log("Found player: ", player);
      if (!player){
        return createUser(existingUserData,repo);
      } else {
        return player;
      }
    } else {
      return createUser(existingUserData,repo);
    }
  }

  function getGame(gameCode,repo){
    game = Utils.getByAttributeValue(repo, "gameCode", gameCode);
    return game;
  }
  
  function createGame(deck, table, gameConfig, gameCode, repo){
    // Create a deck and table
    // Set up 'initial start' params (things that aren't done on every hand) for table
    // Set table blind levels
    // Return game object
    console.log("creating new game");
  
    table.dealerPosition = -1; // We will advance this to 0 when the hand is setup
    table.smallBlind = gameConfig["smallBlindAmount"];
    table.bigBlind = 2 * gameConfig["smallBlindAmount"];
    table.startingChips = gameConfig["startingChips"];
  
    let game = {
        id: repo.length + 1,
        gameCode: gameCode,
        players: [],
        table: table,
        deck: deck,
    }
  
    repo.push(game);
  
    return game;
  }

  module.exports.getOrCreateUser = getOrCreateUser;
  module.exports.createUser = createUser;
  module.exports.createGame = createGame;
  module.exports.getGame = getGame;