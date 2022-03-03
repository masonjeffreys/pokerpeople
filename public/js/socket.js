var form = document.getElementById('form');
var input = document.getElementById('input');

const socket = io({
    query: {
      gameCode: window.location.pathname.split("/")[2]
    },
    auth: {
      token: "abc"
    }
  });


form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

function addPlayer(){
  console.log("inside socket method client");
  socket.emit('add player');
}

socket.on('new player', function(msg){
  console.log('connected ', msg);
})

function startGame(){
  console.log("client requesting game start");
  socket.emit('start game');
}

function nextHand() {
  socket.emit('next hand');
}

function check() {
  socket.emit('check')
}
function bet() {
    var amount = document.getElementById("betAmount").value;
    socket.emit('bet',{amount: amount});
}
function call() {
    socket.emit('call');
}
function fold() {
    socket.emit('fold');
}

socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('private', function(state){
  console.log("Private message: ", state);
  if (state){
    if (state.playersInfo){
      updateAllPlayers(state.playersInfo);
    }
    if (state.table){
      updateTable(state.table);
    }
    if (state.table && state.playersInfo){
      console.log("about to activate player");
      activatePlayer(state.playersInfo, state.table);
    }
    if (state.results){
      updateResults(state.results);
    }
    if (state.actionOpts){
      updateActions(state.actionOpts);
    }
  }
})

socket.on('player added', function(msg){
  console.log("player added ", msg);
})