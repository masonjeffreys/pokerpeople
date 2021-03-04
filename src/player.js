class Player {
    constructor(name) {
      this.name = name;
      this.hand = [];
      this.chips = null;
      this.bet = null;
      this.gameState = 'ACTIVE';
      this.handState = 'IN';
      this.position = null;
      this.dealer = false;
      this.smallBlind = false;
      this.bigBlind = false;
    }
    buyin(numChips){
        this.chips = this.chips + numChips;
    }
    smallBlind(){
        this.smallBlind = true;
    }
    bigBlind(){
        this.bigBlind = true;
    }
    bet(numChips){
        this.chips = this.chips - numChips;
    }
    fold(){
        this.handState = 'OUT'
    }
    leave(){
        this.gameState = 'LEFT'
    }
    bust(){
        this.gameState = 'BUSTED'
    }
    call(){
        
    }

}

module.exports = Player;