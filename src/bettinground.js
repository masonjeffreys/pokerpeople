// Holds state and Logic for managing state for a round betting

function BettingRound(handPlayers, table, activeHandPlayersIndex){
    var _handPlayers = handPlayers;
    var _activeHandPlayersIndex = activeHandPlayersIndex;
    var _activePlayersCount = handPlayers.length;
    var _currentBet = 0;
    var _table = table;
    var _actions = [];
    var _i = 0;
    var _isDone = false;
    var _street = 'preflop';

    function evalForStop(player, action){
        // set _isDone to true if betting should be done
        // Betting will stop if all but 1 player folds
        console.log("eval for stop ", _activePlayersCount, "players", "action", action);
        if (action == 'fold' && _activePlayersCount == 1){
            console.log("Betting is over since only 1 player is left!");
            _endState = 'single player';
            _isDone = true;
        }
        if (action == 'check'){
            // According to poker rules, the betting is done if the player has stopped at the same amount
            // as the person to his/her left that is still in the game.
            // However, this only applies if everyone has has a chance to action.
            // Otherwise the first check after each common card would end the round.

            // Here we check to see if all active players have logged an action for this street
            var allActivePlayersHavePlayed = true;
            handPlayers.forEach(p => {
                if (p.handState == 'IN'){
                   if (_actions.findIndex(a => a.player.id == p.id && a.street == _street) == -1){
                       allActivePlayersHavePlayed = false;
                   }
                }
            })
            _isDone = allActivePlayersHavePlayed;
        }
        if (action == 'call') {
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
            
            if (leftPlayer.bet == player.bet) {
                console.log(`${leftPlayer.name} has matched ${player.name}'s bet of ${player.bet}`);
                _isDone = true;
            } else {
                _isDone = false;
            }
        }
 
    }

    function playerTotalBet(player){
        var playerSum = 0;
        _actions.forEach(a =>{
            if (a.player.id == player.id && a.street == _street) {
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
        get activeHandPlayersIndex(){
            return _activeHandPlayersIndex;
        },
        set activeHandPlayersIndex(value){
            _activeHandPlayersIndex = value;
            return _activeHandPlayersIndex;
        },
        get isDone(){
            return _isDone;
        },
        set isDone(value){
            _isDone = value;
            return _isDone;
        },
        get handPlayers(){
            return _handPlayers;
        },
        get table(){
            return _table;
        },
        get activePlayersCount(){
            return _activePlayersCount;
        },
        addAction: function(player, action, street, amount){
            // Add some validation here
            var logItem = {player: player, action: action, street: street, amount: amount};

            if (action == 'bet'){
                _currentBet = playerTotalBet(player) + amount;
            }
            if (action == 'call'){
                // Nothing to do here except check for stop since a call has to stop betting
            }
            if (action == 'fold'){
                logItem.amount = 0;
                player.handState = 'FOLD';
                _activePlayersCount = _activePlayersCount - 1;
            }

            if (action == 'check'){
                logItem.amount = 0;
            }
            
            console.log("Action is: ", logItem.player.name, logItem.action, logItem.street, logItem.amount);
            _actions.push(logItem);
            evalForStop(player, action);
            return amount;
        },
        get currentBet(){
            return _currentBet;
        },
        set currentBet(value){
            _currentBet = value;
            return this;
        },
        get street(){
            return _street;
        },
        set street(value){
            _street = value;
            return _street;
        },
        getOptions: function(player, street){
            var actionOpts = [];
            var callAmount = this.getCallAmount(player, street);
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