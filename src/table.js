function Table() {
    var _numSeats = 10;
    var _startingChips = 0;
    var _dealerPosition = -1; // First player to join will deal after this advances 1 position at a time
    var _activeIndex = null;
    var _commonCards = [];
    var _burnedCards = [];
    var _bigBlind = null;
    var _smallBlind = null;
    var _pots = [{id: 0, playerAmounts: {}, highBet: 0}]; // will have a main pot, then each time only 1 player can go all-in, we'd need to start tracking side pots.
    var _street = 'preflop';

    var _minRaise = null; // A raise must be at least equal to the largest prior full bet or raise of the current betting round.
    // A player who raises 50% or more of the largest prior bet but less than a minimum raise must make a full minimum raise.
    // If less than 50% it is a call unless 'raise' is first declared or the player is all-in (Rule 45-B).
    // In no-limit and pot limit, an all-in wager (or cumulative multiple short all-ins) totaling
    // less than a full bet or raise will not reopen betting for players who have already acted and are not
    // facing at least a full bet or raise when the action returns to them.


    return Object.freeze({
        get numSeats(){
            return _numSeats;
        },
        set numSeats(value){
            _numSeats = value;
            return this;
        },
        get pots(){
            return _pots;
        },
        set pots(value){
            _pots = value;
            return this;
        },
        get dealerPosition(){
            return _dealerPosition;
        },
        set dealerPosition(value){
            _dealerPosition = value;
            return this;
        },
        get startingChips(){
            return _startingChips;
        },
        set startingChips(value){
            _startingChips = value;
            return this;
        },
        get street(){
            return _street;
        },
        set street(value){
            _street = value;
            return this;
        },
        get activeIndex(){
            return _activeIndex;
        },
        set activeIndex(value){
            _activeIndex = value;
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
        get minRaise(){
            return _minRaise;
        },
        set minRaise(value){
            _minRaise = value;
            return this;
        },
        get burnedCards(){
            return _burnedCards;
        },
        get allInFullBet(){
            return _allInFullBet;
        },
        set allInFullBet(value){
            _allInFullBet = value;
            return this;
        },
        currentPotNumber: function(){
            return _pots.length;
        },
        resetPots: function(){
            console.log("clearing all pots");
            _pots = [{id: 0, playerAmounts: {}, highBet: 0}];
            return this;
        },
        addPot: function(){
            console.log("starting new pot")
            _pots.push({id: _pots.length, playerAmounts: {}, highBet: 0});
            return this;
        },
        addBet: function (playerId, amount, potIndex = _pots.length - 1 ){
            // Reset value of last pot to be previous value plus the new bet
            let prevEntry = _pots[potIndex].playerAmounts[playerId];
            let prevAmount = 0;
            if (prevEntry){
                prevAmount = prevEntry.amount;
            }
            let newAmount = prevAmount + amount;
            if (newAmount > _pots[potIndex].highBet){
                _pots[potIndex].highBet = newAmount;
            }
            _pots[potIndex].playerAmounts[playerId] = {amount: newAmount};
            return this;
        },
        addBurnedCard: function(card){
            console.log("burning ", card);
            _burnedCards.push(card);
            return this;
        },
        get commonCards(){
            return _commonCards;
        },
        set commonCards(value){
            _commonCards = value;
            return this;
        },
        clearCommonCards: function(){
            _commonCards = [];
        },
        addCommonCard: function(card){
            console.log("adding common ", card);
            _commonCards.push(card);
            return this;
        }
    })
}

module.exports = Table