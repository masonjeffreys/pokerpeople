var evaluator = {
    getBestHand: function getBestHand(cards){
        var hand = getRoyalFlush(cards)
        if (!hand) {
            hand = getStraightFlush(cards)
        }
        return hand
    },
    
    getHighCard: function getHighCard(cards){
        var idx = -1;
        for (var i = 0; i < cards.length; i++){
            if(cards[i].value > idx){
                idx = i;
            }
        }
        return {value: HIGH_CARD, cards: [cards[idx]]};
    }
}

exports.evaluator = this.evaluator;



var players = [{name: "John"}, {name: "Paul"}, {name: "Ringo"}, {name: "George"}];

var bestPlayer = null;
var bestHand = null;

for (var i = 0; i<players.length;i++){
    players[i].pocketCards = deck.splice(0,2);
}

var commonCards = [];

function getPlayerWithBestHand(){
    bestPlayer = null;
    bestHand = null;
    for (var i = 0; i < players.length; i++){
        var playerCards = players[i].pocketCards.slice(0);
        playerCards.push.apply(playerCards, commonCards);
        var hand = hands.getBestHand(playerCards);
        if(!bestPlayer || !bestHand){
            bestPlayer = players[i];
            bestHand = hand;
            continue;
        }
        if (hand.value > bestHand.value){
            bestPlayer = players[i];
            bestHand = hand;
            continue;
        }
    }
    return bestPlayer;
}

function echoBestPlayer(round){
    getPlayerWithBestHand();
    console.log('After the ${round}, ${bestPlayer.name} is winning with a ${hands.getName(bestHand.value)}');
}