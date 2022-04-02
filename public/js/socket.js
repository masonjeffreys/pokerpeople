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

function muckTrue(){
  socket.emit('muck', {muck: true});
}

function muckFalse(){
  socket.emit('muck', {muck: false});
}

function startTestGame(){
  socket.emit('test mode');
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
    let inputBox = document.getElementById("betAmount");
    let betButton = document.getElementById("betBtn");
    let amount = inputBox.value;
    let min = inputBox.min;
    let max = inputBox.max;
    if (typeof parseInt(amount) == 'number' && parseInt(amount) >= parseInt(min) && parseInt(amount) <= parseInt(max)){
      socket.emit('bet', {amount: amount});
      inputBox.value = "";
    } else {
      betButton.innerHTML = "Out of range!"
      betButton.classList.remove("hover:bg-indigo-500");
      betButton.classList.remove("focus:bg-indigo-700");
      betButton.classList.remove("bg-indigo-600");
      betButton.classList.add("bg-red-600");
      setTimeout(() => {
        betButton.innerHTML = "Bet"
        betButton.classList.remove("bg-red-600");
        betButton.classList.add("hover:bg-indigo-500");
        betButton.classList.add("focus:bg-indigo-700");
        betButton.classList.add("bg-indigo-600");
      }, 2000);
    }
    
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
    if (state.lastAction){
      updateLastAction(state.lastAction);
    }
    if (state.actionOpts){
      let player = state.playersInfo[state.table.activeIndex];
      updateActions(state.actionOpts, player);
    }
  }
})

socket.on('player added', function(msg){
  console.log("player added ", msg);
})