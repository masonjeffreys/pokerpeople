const CLUBS = "C";
const HEARTS = "H";
const DIAMONDS = "D";
const SPADES = "S";

const SUITS = [CLUBS, HEARTS, DIAMONDS, SPADES];

const CARD_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

var deck = {
    cards: [],

    init: function init(){
        SUITS.forEach((suit) => {
            for (var i=0; i<13; i++){
                this.cards.push({value: i, name: CARD_NAMES[i], suit: suit})
            }
        })
        return deck
    },

    shuffle: function shuffle(){
        var dealCards = this.cards.slice(0);
        for (let i = dealCards.length; i; i--){
            let j = Math.floor(Math.random()*i);
            [dealCards[i-1],dealCards[j]] = [dealCards[j], dealCards[i-1]];
        }
        this.cards = dealCards;
        return deck
    },
    take: function take(){
        return this.cards.shift();
    }
}

exports.deck = deck;