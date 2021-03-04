var deck = require('../src/deck').deck;

describe('deck',()=>{
    it('has 52 cards', () => {
        expect(deck.init().cards.length).toEqual(52)
    })
})