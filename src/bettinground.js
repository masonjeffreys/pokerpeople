// Holds state and Logic for managing state for a round betting

function BettingRound(handPlayers, table){
    var _handPlayers = handPlayers;
    var _currentBet = 0;
    var _table = table;
    var _actions = [];
    var _i = 0;

    function evalNextAction(){
        console.log('return complete if betting round is done')
    }

    return Object.freeze({
        listActions: function(){
            console.log(_actions);
        },
        addAction: function(player, action, value){
            // Add some validation here
            _actions.push(
                {player: player,
                action: action,
                value: value}
            );
        },
        get currentBet(){
            return _currentBet;
        },
        set currentBet(value){
            _currentBet = value;
            return this;
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