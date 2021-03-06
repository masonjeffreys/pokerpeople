function Player(id, name) {
      var _id = id;
      var _name = name;
      var _hand = [];
      var _chips = null;
      var _bet = null;
      var _gameState = 'ACTIVE';
      var _handState = 'IN';
      var _button = false;
      var _tablePosition = null;
      var _smallBlind = false;
      var _bigBlind = false;
      return Object.freeze({
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

            get bet(){
                  return _bet;
            },

            set bet(value){
                  _bet = value;
                  return this;
            },
      });
}

module.exports = Player;