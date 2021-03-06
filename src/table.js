const STAGES = ['preflop', 'flop', 'turn', 'river']

function Table(id) {
    var _id = id;
    var _round = null;
    var _position = null;
    var _dealerPosition = null;
    var _commonCards = [];
    var _burnedCards = [];
    var _players = [];
    var _handPlayers = [];
    var _pot = null;
    var _bigBlind = null;
    var _smallBlind = null;
    var _sidePots = [];
    return Object.freeze({
        get players(){
            return _players;
        },
        addPlayer(player){
            _players.push(player);
        }
    })
}

module.exports = Table