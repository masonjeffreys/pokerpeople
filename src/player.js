function Player(id, name) {
      var _id = id;
      var _name = name;
      var _hand = [];
      var _chips = null;
      var _currentBet = null;
      var _gameState = 'ACTIVE';
      var _handState = 'IN';

      // The following vars seem like they might be outside of what a player should know
      var _actedInStreet = false; // how we track whether a betting round is done.
      var _dealerButton = false;
      var _tablePosition = null;
      var _smallBlind = false;
      var _bigBlind = false;


      return Object.freeze({
            init: function init(firstname, lastname){
                  return {playerId: 1, firstname: firstname, lastname: lastname};
            },

            get id(){
                  return _id;
            },
            
            get name(){
                  return _name;
            },

            set name(value){
                  _name = value;
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
            get dealerButton(){
                  return _dealerButton;
            },

            set dealerButton(value){
                  _dealerButton = value;
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
            get currentBet(){
                  return _currentBet;
            },
            resetBet: function(){
                  _currentBet = 0;
                  return _this;
            },
            makeBet: function(value){
                  _bet = _bet + value;
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