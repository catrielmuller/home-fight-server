const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 5000;
const uuid = require("uuid/v1");
app.get("/", (req, res) => {
  res.send("<h1>Home Fight Server</h1>");
});

const players = {};
const score = {};
io.on("connection", socket => {
  console.log("a user connected", socket.id);
  players[socket.id] = {
    id: socket.id,
    anim: "standFire",
    velx: 0,
    vely: 0,
    accx: 0,
    accy: 0,
    r: false
  };

  socket.on("initPlayer", data => {
    console.log(data.username);
    if (players[socket.id]) {
      console.log("Player found: ", players[socket.id]);
      players[socket.id].username = data.username;
    }
    socket.broadcast.emit("newPlayer", players[socket.id]);
    socket.emit("currentPlayers", players);
    console.log(players);
  });

  socket.on("move", position => {
    if (players[socket.id]) {
      players[socket.id] = {
        ...players[socket.id],
        ...position
      };

      socket.broadcast.emit("playerMove", players[socket.id]);
    }
  });

  socket.on("sendProjectile", projectileRecieved => {
    io.emit("broadcastProjectile", {
      id: uuid(),
      ...projectileRecieved
    });
  });

  socket.on("fireballPickedUp", fireballPickedUp => {
    console.log("fireballPickedUp", fireballPickedUp);
    socket.broadcast.emit("fireballPickedUp", fireballPickedUp);
  });

  socket.on("fireballExploded", fireballExploded => {
    console.log("fireballExploded", fireballExploded);
    socket.broadcast.emit("fireballExploded", fireballExploded);
  });

  socket.on("hit", hitInfo => {
    console.log("hit registered: ", hitInfo);
    //TODO: add hit checking and logic?
    io.emit("hitConfirmed", hitInfo);
    //TODO: Update score on server
    console.log("updating score: ", score);
    io.emit("updateScore", score);
  });

  socket.on("playerDeath", playerInfo => {
    console.log("player death registered: ", playerInfo);
    //TODO: add hit checking and logic?
    io.emit("playerDeathConfirmed", playerInfo);
    //TODO: Update score on server
    console.log("updating score: ", score);
    io.emit("updateScore", score);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("deletePlayer", socket.id);
    console.log(`user disconnected: $socket.id`);
    console.log("Remaining users", Object.keys(players));
  });
});

http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
