function Player(id, firstName, lastName) {
      // User level concerns (consistent no matter the game)
      var _id = id;
      var _firstName = firstName;
      var _lastName = lastName;
      var _lastGameCode = null;

      // Game level concerns (i.e. will change with each game)
      var _socketId = null;
      var _hand = [];
      var _chips = 0;
      var _gameState = 'ACTIVE';
      var _handState = 'IN';

      // The following vars seem like they might be outside of what a player should know
      var _actedInStreet = false; // how we track whether a betting round is done.
      var _button = false;
      var _tablePosition = null;
      var _smallBlind = false;
      var _bigBlind = false;
      var _allInPotNumber = null; // set to the pot number that the player is all-in for;
      var _foldPotNumber = null; // set to the pot number that the player folded in;
      var _publicHand = false;


      return Object.freeze({
            init: function init(id, firstname, lastname){
                  return {playerId: id, firstname: firstname, lastname: lastname};
            },

            get id(){
                  return _id;
            },

            get socketId(){
                  return _socketId;
            },

            set socketId(value){
                  _socketId = value;
                  return this;
            },

            get allInPotNumber(){
                  return _allInPotNumber;
            },

            set allInPotNumber(value){
                  _allInPotNumber = value;
                  return this;
            },

            get foldPotNumber(){
                  return _foldPotNumber;
            },

            set foldPotNumber(value){
                  _foldPotNumber = value;
                  return this;
            },

            get publicHand(){
                  return _publicHand;
            },

            set publicHand(value){
                  _publicHand = value;
                  return this;
            },

            get lastGameCode(){
                  return _lastGameCode;
            },

            set lastGameCode(value){
                  _lastGameCode = value;
                  return this;
            },

            get firstName(){
                  return _firstName;
            },
            set firstName(value){
                  _firstName = value;
                  return this;
            },

            get lastName(){
                  return _lastName;
            },
            set lastName(value){
                  _lastName = value;
                  return this;
            },
            
            get actedInStreet(){
                  return _actedInStreet;
            },

            set actedInStreet(value){
                  _actedInStreet = value;
                  return this;
            },

            get hand(){
                  return _hand;
            },

            get chips(){
                  return _chips;
            },

            set chips(value){
                  _chips = value;
                  return this;
            },
            
            get gameState(){
                  return _gameState;
            },

            set gameState(value){
                  _gameState = value;
                  return this;
            },
            get handState(){
                  return _handState;
            },

            set handState(value){
                  _handState = value;
                  return this;
            },
            get tablePosition(){
                  return _tablePosition;
            },
            set tablePosition(value){
                  _tablePosition = value;
                  return this;
            },
            get button(){
                  return _button;
            },

            set button(value){
                  _button = value;
                  return this;
            },
            get smallBlind(){
                  return _smallBlind;
            },

            set smallBlind(value){
                  _smallBlind = value;
                  return this;
            },
            get bigBlind(){
                  return _bigBlind;
            },

            set bigBlind(value){
                  _bigBlind = value;
                  return this;
            },
            prettyName: function(){
                  return _firstName + " " + _lastName;
            },
            makeBet: function(value){
                  _chips = _chips - value;
                  return this;
            },
            wins: function(value){
                  _chips = _chips + value;
                  return this;
            },
            addCard: function(value){
                  _hand.push(value);
                  return this;
            },
            clearHand: function(){
                  _hand = [];
                  return this;
            }
      });
}

module.exports = Player;