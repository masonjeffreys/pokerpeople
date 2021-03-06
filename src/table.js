const STAGES = ['preflop', 'flop', 'turn', 'river']

function Table(id) {
    var _id = id;
    var _round = null;
    var _position = null;
    var _dealerPosition = null;
    var _commonCards = [];
    var _burnedCards = [];
    var _pot = null;
    var _bigBlind = null;
    var _smallBlind = null;
    var _sidePots = [];
    return Object.freeze({
        // get tablePlayers(){
        //     return _tablePlayers;
        // },
        // addTablePlayer(player){
        //     _tablePlayers.push(player);
        // },
        // get handPlayers(){
        //     return _handPlayers;
        // },
        // clearHandPlayers(){
        //     _handPlayers = [];
        // },
        // addHandPlayer(player){
        //     _handPlayers.push(player);
        // }
    })
}

module.exports = Table