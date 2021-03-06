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

    function playerTotalBet(player){
        var playerSum = 0;
        var playerId = player.id;
        _actions.forEach(a =>{
            if (a.player.id == playerId) {
                playerSum = playerSum + a.amount;
            }
        })
        return playerSum;
    }

    return Object.freeze({
        listActions: function(){
            console.log(_actions);
        },
        getCallAmount: function(player){
            return _currentBet - playerTotalBet;
        },
        addAction: function(player, action, amount){
            // Add some validation here
            if (action == 'bet'){
                _currentBet = _currentBet + parseInt(amount);
                console.log("new current bet is ", _currentBet);
            }
            if (action == 'call'){
                amount = _currentBet - playerTotalBet(player);
                console.log("current bet is: ", _currentBet, "playerMax is", playerTotalBet(player));
            }
            if (action == 'fold'){
                amount = 0;
                console.log("player ", player.name, " is OUT")
            }
            _actions.push(
                {player: player,
                action: action,
                amount: amount}
            );
        },
        get currentBet(){
            return _currentBet;
        },
        set currentBet(value){
            _currentBet = value;
            return this;
        },
        getOptions: function(player){
            var actionOpts = [];
            var callAmount = _currentBet - playerTotalBet(player);
            if ( callAmount > 0 ){
                actionOpts.push(`${callAmount} to call`);
            }
            if (callAmount == 0){
                actionOpts.push(`Check`);
            }
            if (player.chips > 0){
                actionOpts.push(`All in with ${player.chips} more chips.`)
            }
            actionOpts.push(`Fold`)
            return actionOpts;
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