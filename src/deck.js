const CLUBS = "c";
const HEARTS = "h";
const DIAMONDS = "d";
const SPADES = "s";

const SUITS = [CLUBS, HEARTS, DIAMONDS, SPADES];

const CARD_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

function Deck() {
    var _cards = [];

    return Object.freeze({
        get cards(){
            return _cards;
        },
        cardCount: function(){
            return _cards.length;
        },
        init: function init(){
            _cards = [];
            SUITS.forEach((suit) => {
                CARD_NAMES.forEach(card_name =>{
                    _cards.push(card_name + suit)
                })
            })
            return this;
        },
        shuffle: function shuffle(){
            var dealCards = _cards.slice(0);
            for (let i = dealCards.length; i; i--){
                let j = Math.floor(Math.random()*i);
                [dealCards[i-1],dealCards[j]] = [dealCards[j], dealCards[i-1]];
            }
            _cards = dealCards;
            return this;
        },
        take: function take(){
            let selected = _cards[0];
            _cards = _cards.slice(1);
            return {
                card: selected,
                deck: this
            }
        }

    })
}

module.exports = Deck;