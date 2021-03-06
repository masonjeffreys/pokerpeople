// Holds state and Logic for managing state for a round betting

function BettingRound(handPlayers, table, handPlayersStartingIndex){
    var _handPlayers = handPlayers;
    var _table = table;
    var _actions = [];
    var _handPlayersStartingIndex = handPlayersStartingIndex;
    var _i = 0;

    function evalNextAction(){
        console.log('return complete if betting round is done')
    }

    return Object.freeze({
        addAction: function(player, action, value){
            _actions.push(
                {player: player,
                action: action,
                value: value}
            );
            evalNextAction(_actions);
        },
        next: function(){
            if (_i == 1){
                return false
            } else {
                _i == _i + 1;
                return true
            }
        }
    })
    
}

module.exports = BettingRound