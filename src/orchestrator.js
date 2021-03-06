// set of methods used to update the dumb state objects of deck, table, player
const STAGES = ['preflop', 'flop', 'turn', 'river']

const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');

const reader = require("readline-sync");

var player1 = Player(1, "Jon Snow");
var player2 = Player(2, "James Taylor");
var player3 = Player(3, "Jimmy Dean");

var table = Table(1);
var deck = Deck(1);
var handPlayers = [];
var activeTablePosition = null;

function startGame(table, deck, players, startingChips, smallBlindAmount){
    players.forEach(function(player, index){
        player.chips = startingChips;
        player.tablePosition = index + 1;
    });
    table.smallBlind = smallBlindAmount;
    table.bigBlind = 2 * smallBlindAmount;
    table.round = 1;
    table.dealerPosition = 1;
    deck.init().shuffle();
};

function setHandPlayers(players, table){
    players.forEach(function(player, index) {
        if (player.gameState == 'ACTIVE' && player.chips >= 50){
            player.handState = 'IN';
            handPlayers.push(player)
        } else {
            player.handState = 'OUT';
        }
        console.log("at this point, ", player.tablePosition)
    });
}

function getNextHandPlayerIndex(previousTablePosition, handPlayers){
    var i = handPlayers.findIndex(obj => obj.tablePosition >= previousTablePosition + 1);
    if (i == -1){
        return 0;
    } else {
        return i;
    }
}

function getCurrentPlayerIndex(tablePosition, handPlayers){
    var i = handPlayers.findIndex(obj => obj.tablePosition >= tablePosition);
    if (i == -1){
        return 0;
    } else {
        return i;
    }
}

function setDealer(table, handPlayers){
    var i = getCurrentPlayerIndex(table.dealerPosition, handPlayers);
    handPlayers[i].button = true;
}

function deal(numCards, deck, table, handPlayers){
    // person after dealer gets first card
    activeTablePosition = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    console.log("again, dealer position is ", table.dealerPosition);
    console.log("First table position to receive card is ", activeTablePosition);
    console.log("first card receiver is", handPlayers[activeTablePosition].name);
    //then perform dealing
    // for (var i = 0; i < numCards; i++){
    //     handPlayers.forEach(function(player, index){
    //         if (player.handState == 'IN'){
    //             console.log(index);
    //             var card = deck.take();
    //             player.hand.push(card);
    //             console.log(player.name, "was given", card);
    //         }
    //     })
    // };
}

function preFlopBetRound(){
    //find active person pass small blind and big blind
    //offer options to active person call, fold, raise (not check here)
    //update pot and player based on action
    //evaluate next action
        //declare winner
        //advance to next player
        //close bet round and flop
    console.log("Implement betting round logic");
}



var players = [player1, player2, player3];
startGame(table, deck, players, 100, 5);
setHandPlayers(players, table);
setDealer(table, handPlayers);
deal(2, deck, table, handPlayers);
preFlopBetRound();

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
