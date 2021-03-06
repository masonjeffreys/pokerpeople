// Holds state and Logic for managing state for a round betting

function BettingRound(handPlayers, table){
    var _handPlayers = handPlayers;
    var _activePlayers = handPlayers.length;
    var _currentBet = 0;
    var _table = table;
    var _actions = [];
    var _i = 0;
    var _isDone = false;

    function evalForStop(player){
        // Betting will stop if all but 1 player folds
        if (_activePlayers == 1){
            console.log("Betting is over since only 1 player is left!");
            return true;
        } else{
            // return true if betting should be done
            // According to poker rules, the betting is done if the player has stopped at the same amount
            // as the person to his/her left that is still in the game.
            var playerIndex = handPlayers.findIndex(obj => obj.id == player.id);
            
            //get player to the left that hasn't folded by advancing through array
            var leftPlayerIndex = null;
            var i = playerIndex + 1;

            while (true){
                if (i >= handPlayers.length){
                    //Start again at end if we go high
                    i = 0;
                }
                if (handPlayers[i].handState == 'IN'){
                    leftPlayerIndex = i;
                    break;
                }
                i = i + 1;
            }
    
            leftPlayer = handPlayers[leftPlayerIndex];
            
            if (leftPlayer.bet === player.bet) {
                console.log(`${leftPlayer.name} has matched ${player.name}'s bet of ${player.bet}`);
                return true;
            } else {
                return false;
            }
        }
 
    }

    function playerTotalBet(player){
        var playerSum = 0;
        _actions.forEach(a =>{
            if (a.player.id == player.id) {
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
            return (_currentBet - playerTotalBet(player));
        },
        get isDone(){
            return _isDone;
        },
        addAction: function(player, action, amount){
            // Add some validation here
            var logItem = {player: player, action: action, amount: amount}
            if (action == 'bet'){
                _currentBet = _currentBet + amount;
            }
            if (action == 'call'){
                // Nothing to do here
            }
            if (action == 'fold'){
                logItem.amount = 0;
                console.log("player ", player.name, " FOLDED")
            }
            console.log("Action is: ", logItem.player.name, logItem.action, logItem.amount);
            _actions.push(logItem);
            _isDone = evalForStop(player);
            return amount;
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
            var callAmount = this.getCallAmount(player);
            actionOpts.push(`Bet up to ${player.chips}`);
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