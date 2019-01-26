const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 5000

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
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('getPlayers', () => {
        socket.emit('currentPlayers', players);
    });

    socket.on('move', (position) => {
        if(players[socket.id]){
            players[socket.id].x = position.x;
            players[socket.id].y = position.y;
            players[socket.id].r = position.r;
            socket.broadcast.emit('playerMove', players[socket.id]);
        }
    });

    socket.on('sendProjectile', (projectileRecieved) => {
        console.log('got projectile ',projectileRecieved);
        socket.emit('broadcastProjectile', projectileRecieved);
    });


    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('deletePlayer', socket.id);
        console.log('user disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`Listening on ${ PORT }`);
});