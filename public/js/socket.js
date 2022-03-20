// grab everything we need
const btn = document.querySelector(".mobile-menu-button");
const closeBtn = document.querySelector(".close-mobile-menu-button");
const sidebar = document.querySelector(".sidebar");

// add our event listener for the click
btn.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
});
closeBtn.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
});

const socket = io({
    query: {
      gameCode: window.location.pathname.split("/")[2]
    },
    auth: {
      token: "abc"
    }
  });

var chatForm = document.getElementById('form');
  
if (chatForm){
  var input = document.getElementById('input');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
  });
}

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

function startTestGame(){
  console.log("client requesting test game start");
  socket.emit('start test game');
}

function nextHand() {
  socket.emit('next hand');
}

function nextStreet(){
  socket.emit('advance');
}

function check() {
  socket.emit('check')
}
function bet() {
    var amount = document.getElementById("betAmount").value;
    socket.emit('bet', {amount: amount});
}
function call() {
    socket.emit('call');
}
function fold() {
    socket.emit('fold');
}

function allIn() {
  socket.emit('all in');
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
      updateAllPlayers(state.playersInfo, state.playerId);
    }
    if (state.game && state.game.status){
      toggleAdvanceButton(state.game.status);
      renderGameStatus(state.game.status, state.playersInfo);
    }
    if (state.game && state.game.errors){
      renderErrors(state.game.errors);
    }
    if (state.table){
      updateTable(state.table);
    }
    if (state.table && state.playersInfo){
      activatePlayer(state.playersInfo, state.table);
    }
    if (state.results){
      updateResults(state.results);
    }
    if (state.actionOpts){
      updateActions(state.actionOpts, state.playerId);
    }
    if (state.lastAction){
      updateLastAction(state.lastAction);
    }
  }
})

socket.on('player added', function(msg){
  console.log("player added ", msg);
})