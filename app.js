console.log("Welcome to poker night");

const table = require('./src/table').table;
const Player = require('./src/player.js')

var player1 = new Player("Jonas Bro");
var player2 = new Player("James Taylor");
var player3 = new Player("Jimmy Dean");

players = [player1, player2, player3];

table.start(players, 100, 5, 10);

function roundOfPoker(){
    //Preflop
    table.deal(2);
    table.bet();

    //Flop
    table.burn(3);
    table.turn(3);
    table.bet();

    //Turn
    table.burn(1);
    table.turn(1);
    table.bet();

    //River
    table.burn(1);
    table.turn(1);
    table.bet();

    //EndRound
    console.log(table);
}
roundOfPoker();

table.newRound();

roundOfPoker();

table.newRound();

roundOfPoker();


// const readline = require('readline').createInterface({
//     input: process.stdin,
//     output: process.stdout
// })



// readline.question(`What's your name?`, name => {
//     console.log(`Hi ${name}!`)
//     deck.init();
//     deck.shuffle();
//     console.log(deck);
//     readline.close()
// })

