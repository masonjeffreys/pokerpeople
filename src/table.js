function Table(id) {
    var _id = id;
    var _round = null;
    var _position = null;
    var _dealerPosition = null;
    var _commonCards = [];
    var _burnedCards = [];
    var _pot = null;
    var _bigBlind = null;
    var _smallBlind = null;
    var _sidePots = [];
    return Object.freeze({
        get id(){
            return _id;
        },
        get dealerPosition(){
            return _dealerPosition;
        },
        set dealerPosition(value){
            _dealerPosition = value;
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
        get pot(){
            return _pot;
        },
        set pot(value){
            _pot = value;
            return _pot;
        },
        get burnedCards(){
            return _burnedCards;
        },
        addBurnedCard: function(card){
            console.log("burning ", card);
            _burnedCards.push(card);
            return this;
        },
        get commonCards(){
            return _commonCards;
        },
        addCommonCard: function(card){
            console.log("adding common ", card);
            _commonCards.push(card);
            return this;
        }
    })
}

module.exports = Table