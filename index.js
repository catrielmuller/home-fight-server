const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send('<h1>Home Fight Server</h1>');
});

const players = {};
io.on('connection', (socket) => {
    console.log('a user connected');
    players[socket.id] = {
        id: socket.id,
        r: 0,
        x: 200,
        y: 200
    };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('getPlayers', () => {
        socket.emit('currentPlayers', players);
    });

    socket.on('move', (position) => {
        if(players[socket.id]){
            players[socket.id].x = position.x;
            players[socket.id].y = position.y;
            players[socket.id].r = position.r;
            console.log(players[socket.id]);
            socket.broadcast.emit('playerMove', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('deletePlayer', players[socket.id]);
        console.log('user disconnected');
    });
});

http.listen(3005, () => {
    console.log('listening on *:3005');
});