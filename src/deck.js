const CLUBS = "C";
const HEARTS = "H";
const DIAMONDS = "D";
const SPADES = "S";

const SUITS = [CLUBS, HEARTS, DIAMONDS, SPADES];

const CARD_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

function Deck(id) {
    var _id = id;
    var _cards = [];

    return Object.freeze({
        listCards: function(){
            console.log(_cards);
        },
        init: function init(){
            SUITS.forEach((suit) => {
                for (var i=0; i<13; i++){
                    // Index starts at 0. Card values start at 2.
                    _cards.push({value: i + 2, name: CARD_NAMES[i], suit: suit})
                }
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
            return _cards.shift();
        }

    })
}

module.exports = Deck;