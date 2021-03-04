const STAGES = ['preflop','flop','turn','river']

const deck = require('./deck').deck;

var table = {
    round: null,
    position: null,
    dealerPosition: null,
    deck: {},
    commonCards: [],
    burnedCards: [],
    players: [],
    pot: null,
    bigBlind: null,
    smallBlind: null,
    sidePots: [],
    deal: function(numCards){
        console.log("Dealing hole cards");
        for (var i = 0; i < numCards; i++){
            players.forEach(p => {
                var c = deck.take();
                p.hand.push(c);
            });
        }
    },
    burn: function(numCards){
        for (var i = 0; i < numCards; i++){
            this.burnedCards.push(deck.take());
            console.log("burning a card");
        }
    },
    turn: function(numCards){
        for (var i = 0; i < numCards; i++){
            this.commonCards.push(deck.take());
            console.log("adding a card to common");
        }
    },
    bet: function(){
        console.log("round of betting");
    },
    advance: function(){
        this.position = this.position + 1;
        if (this.position > this.players.length) {
            this.position = 1;
        }
        console.log('next player is ', this.players.position);
    },
    start: function(players, chips, smallBlind, bigBlind){
        this.players = players;
        this.players.forEach(p => {
            p.chips = chips;
        });
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.position = 1;
        this.round = 1;
        this.dealerPosition = 1;
        this.deck = deck.init().shuffle().cards;
    },
    newRound: function(){
        this.dealerPosition = this.dealerPosition + 1;
        if (this.dealerPosition > this.players.length - 1){
            this.dealerPosition = 1;
        }
        console.log('new dealer is ', players[this.dealerPosition - 1].name);
        this.deck = deck.init().shuffle().cards;
        console.log('cards are shuffled');
    }
}

exports.table = table