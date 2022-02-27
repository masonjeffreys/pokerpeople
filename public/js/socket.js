var form = document.getElementById('form');
var input = document.getElementById('input');

const socket = io({
    query: {
      gameId: window.location.pathname.split("/")[2]
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

function addPlayerSocket(){
  console.log("inside socket method client");
  socket.emit('add player', {playerId: "15"});
}

socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('player added', function(msg){
  console.log("player added");
})