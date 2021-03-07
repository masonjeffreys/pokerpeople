// set of methods used to update the dumb state objects of deck, table, player
const STAGES = ['preflop', 'flop', 'turn', 'river']

const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');
const BettingRound = require('./bettingRound');

const reader = require("readline-sync");
var streetIndex = 0;
var street = STAGES[0];

var players = [Player(1, "Dealer"), Player(2, "SmBnd"), Player(3, "LgBnd"), Player(4, "Jeff Mason")];

var table = Table(1);
var deck = Deck(1);
var handPlayers = [];

function startGame(table, deck, players, startingChips, smallBlindAmount){
    players.forEach(function(player, index){
        player.chips = startingChips;
        player.tablePosition = index + 1;
        player.bet = 0;
    });
    table.smallBlind = smallBlindAmount;
    table.bigBlind = 2 * smallBlindAmount;
    table.round = 1;
    table.dealerPosition = 1;
    table.pot = 0;
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

function setDealerAndBlinds(table, handPlayers){
    var i = getCurrentPlayerIndex(table.dealerPosition, handPlayers);
    handPlayers[i].button = true;
    var j = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    handPlayers[j].smallBlind = true;
    var k = getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers);
    handPlayers[k].bigBlind = true;
}

function deal(numCards, deck, table, handPlayers){
    // person after dealer gets first card
    activeHandPlayersIndex = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    for (var i = 0; i < numCards; i++){
        for( var j=0; j < handPlayers.length; j++) {
            var pointer = (j + activeHandPlayersIndex) % handPlayers.length;
            var card = deck.take();
            var player = handPlayers[pointer];
            player.hand.push(card);
        }
    }
}

function preFlopSetup(table, handPlayers){
    var smallBlindIndex = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    var bigBlindIndex = getNextHandPlayerIndex(table.dealerPosition + 1, handPlayers);
    var activeHandPlayersIndex = getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers);

    bettingRound = BettingRound(handPlayers, table, activeHandPlayersIndex);

    // add small blind. Player makes bet first..then table is adjusted...then action logged
    var smallBlindPlayer = handPlayers[smallBlindIndex];
    handPlayers[smallBlindIndex].makeBet(table.smallBlind);
    bettingRound.currentBet = table.smallBlind;
    table.pot = table.pot + table.smallBlind;
    bettingRound.addAction(handPlayers[smallBlindIndex], "smallBlind", table.smallBlind);

    // add big blind. I think I need callbacks here to do these in the right order
    handPlayers[bigBlindIndex].makeBet(table.bigBlind);
    bettingRound.addAction(handPlayers[bigBlindIndex], "bigBlind", table.smallBlind * 2)
    bettingRound.currentBet = table.smallBlind * 2;
    table.pot = table.pot + table.bigBlind;

    return bettingRound;
}

function executeBetRound(bettingRound){

    //Infinite loop through people until betting is closed, then break
    var stopBetting = false;
    var adjustedIndex = bettingRound.activeHandPlayersIndex;

    while (true){
        // Ask player for action
        player = bettingRound.handPlayers[adjustedIndex];
        if (player.handState == 'IN'){
            // Remind player of current hand table state
            console.log(`Player up: ${player.name}`);
            console.log(`Pot: ${table.pot}`, `Bet: ${bettingRound.currentBet}`, `You're in ${player.bet}`);
            // Prompt player based on options
            var actionOpts = bettingRound.getOptions(player)
            // Get action from player
            var action = reader.question(actionOpts + "\n");
            var amount = null;
            
            if (action == 'bet'){
                amount = parseInt(reader.question("Bet amount?"));
                player.makeBet(amount);
                bettingRound.addAction(player, "bet", amount);
                bettingRound.table.pot = bettingRound.table.pot + amount;
            }

            if (action == 'fold'){
                bettingRound.addAction(player, "fold");
            }

            if (action == 'call'){
                var callAmount = bettingRound.getCallAmount(player);
                player.makeBet(callAmount);
                bettingRound.addAction(player, "call", callAmount);
                bettingRound.table.pot = bettingRound.table.pot + callAmount;
            }
        }

        // Eval if action shoud stop
        stopBetting = bettingRound.isDone;
        if (stopBetting === true){
            console.log("This street is over!");
            break;
        }
        // Move to next player
        adjustedIndex = (1 + adjustedIndex) % bettingRound.handPlayers.length
    }
    
        //declare winner or
        //advance to next player or
        //close bet round and flop or
}

function closeRound(bettingRound){
    if (bettingRound.activePlayersCount == 1){
        // Winning player, others folded
        var winner = bettingRound.handPlayers.find(p => p.handState == 'IN');
        console.log("Winner: ", winner.name);
    }
}

startGame(table, deck, players, 100, 5);
setHandPlayers(players, table);
setDealerAndBlinds(table, handPlayers);
deal(2, deck, table, handPlayers);
var bettingRound = preFlopSetup(table, handPlayers);
executeBetRound(bettingRound);
closeRound(bettingRound);


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
