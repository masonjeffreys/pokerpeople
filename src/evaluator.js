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