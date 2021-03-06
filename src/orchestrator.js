// set of methods used to update the dumb state objects of deck, table, player
const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');

const reader = require("readline-sync");

var player1 = Player(1, "Jon Snow");
var player2 = Player(2, "James Taylor");
var player3 = Player(3, "Jimmy Dean");

var table = Table(1);
var deck = Deck(1);

function startGame(table, deck, players, startingChips, smallBlindAmount){
    players.forEach(p => {
        p.chips = startingChips;
        console.log("Player added: ", p.name, " with ", p.chips, " chips.");
    });
    table.smallBlind = smallBlindAmount;
    table.bigBlind = 2 * smallBlindAmount;
    table.position = 1;
    table.round = 1;
    table.dealerPosition = 1;
    deck.init().shuffle();
    deck.listCards();
};

function setHandPlayers(players){
    players.forEach(p => {
        if (p.gameState == 'ACTIVE' && p.chips >= 50){
            p.handState = 'IN';
            console.log("Player: ", p.name, " is IN with ", p.chips, " chips.");
        } else {
            p.handState = 'OUT';
        }
    });
}

function deal(numCards, deck, players){
    for (var i = 0; i < numCards; i++){
        players.forEach(p => {
            if (p.handState == 'IN'){
                var c = deck.take();
                p.hand.push(c);
                console.log(p.name, "was given", c);
            }
        })
    };
}



var players = [player1, player2, player3];
startGame(table, deck, players, 100, 5);
setHandPlayers(players);
deal(2, deck, players);

// deal: ,
// burn: function(numCards){
//     for (var i = 0; i < numCards; i++){
//         this.burnedCards.push(this.deck.take());
//         console.log("burning a card");
//     }
// },
// turn: function(numCards){
//     for (var i = 0; i < numCards; i++){
//         this.commonCards.push(this.deck.take());
//         console.log("adding a card to common");
//     }
// },
// bettingRound: function(){
//     var actions = [];
//     while (actions.length == 0){
//         this.handPlayers.forEach(hP => {
//             if (hP.handState == 'IN'){
//                 var action = reader.question("Action?")
//                 var amount = null;
//                 if (action == 'bet'){
//                     amount = reader.question("Bet amount?")
//                     hP.chips = hP.chips - amount;
//                 } else {
//                     amount = 0;
//                 }
                
//                 actions.push({player: hP, action: action, amount: amount})
//             }
//         })
//     }
// },
// advance: function(){
//     this.position = this.position + 1;
//     if (this.position > this.players.length) {
//         this.position = 1;
//     }
//     console.log('next player is ', this.players.position);
// },
// ,
// newRound: function(){
//     this.dealerPosition = this.dealerPosition + 1;
//     if (this.dealerPosition > this.players.length - 1){
//         this.dealerPosition = 1;
//     }
//     console.log('new dealer is ', players[this.dealerPosition - 1].name);
//     this.deck = deck.init().shuffle().cards;
//     console.log('cards are shuffled');
// }

// function roundOfPoker(){
//     //Preflop
//     table.deal(2);
//     table.bettingRound();

//     //Flop
//     table.burn(1);
//     table.turn(3);
//     table.bettingRound();

//     //Turn
//     table.burn(1);
//     table.turn(1);
//     table.bettingRound();

//     //River
//     table.burn(1);
//     table.turn(1);
//     table.bettingRound();

//     //EndRound
//     console.log(table);
// }
