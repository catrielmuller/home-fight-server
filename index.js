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

  socket.on("initPlayer", data => {
    players[socket.id] = {
      id: socket.id,
      anim: "standFire",
      velx: 0,
      vely: 0,
      accx: 0,
      accy: 0,
      r: false,
      username: data.username,
      bullets: data.bullets
    };
    socket.broadcast.emit("newPlayer", players[socket.id]);
    socket.emit("currentPlayers", players);
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
    if (players[socket.id] && players[socket.id].bullets >= 1) {
      players[socket.id].bullets--;
      io.emit("playerBullet", players[socket.id]);
      console.log("send playerBullet");
    }
    io.emit("broadcastProjectile", {
      id: uuid(),
      ...projectileRecieved
    });
  });

  socket.on("fireballPickedUp", fireballPickedUp => {
    if (players[socket.id]) {
      players[socket.id].bullets++;
      io.emit("playerBullet", players[socket.id]);
      console.log("send playerBullet");
    }
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
    if (!players[socket.id]) {
      return;
    }
    const { bullets } = players[socket.id];
    players[socket.id].bullets = bullets > 0 ? Math.floor(bullets / 2) : -1;
    const bulletsDiff = bullets - players[socket.id].bullets;
    io.emit("hitConfirmed", hitInfo,bulletsDiff);
    io.emit("playerBullet", players[socket.id]);
    if (bulletsDiff > 0) {
      for (let i = 0; i < bulletsDiff * 0.5; i++) {
        const { x, y } = players[socket.id];

        const angle = Math.PI * Math.random();
        const v = 200;
        const offset = 15;
        const velX = v * Math.cos(angle) + players[socket.id].velx;
        const velY = 2 * -v * Math.sin(angle) + players[socket.id].vely;
        const xDir = io.emit("spawnBullet", {
          id: uuid(),
          x: x + offset * Math.cos(angle),
          y: y - offset * Math.sin(angle),
          velX,
          velY
        });
      }
    }
    //TODO: Update score on server
  });

  socket.on("playerDeath", playerInfo => {
    console.log("player death registered: ", playerInfo);
    //TODO: add hit checking and logic?
    io.emit("playerDeathConfirmed", playerInfo);
    //TODO: Update score on server
    console.log("updating score: ", score);
    io.emit("updateScore", score);
  });

  var interval = setTimeout(spawnBullets, 10000);
  socket.on("disconnect", () => {
    delete players[socket.id];
    console.log(`user disconnected: $socket.id`);
    console.log("Remaining users", Object.keys(players));
    clearTimeout(interval);
  });
});

function spawnBullets() {
  interval = setTimeout(spawnBullets, 5000 + Math.random() * 10000);
  console.log("SPAWN BULLETS with players ", Object.keys(players).length);
  if (Object.keys(players).length <= 0) {
    console.log("no players or only one player, no need to spawn bullets :) ");
  } else {
    var spawnLocation = getRandomSpawnLocation();
    console.log("about to spawn a bullet on location ", spawnLocation);
    io.emit("spawnBullet", {
      ...spawnLocation,
      id: uuid()
    });
  }
}

function getRandomSpawnLocation() {
  spawnlocations = [
    { x: 100, y: 200 },
    { x: 50, y: 500 },
    { x: 200, y: 1000 },
    { x: 250, y: 550 },
    { x: 100, y: 300 },
    { x: 600, y: 1000 }
  ];
  const xOffset = -50 + Math.random() * 100;
  const { x, y } = spawnlocations[_getRndInteger(0, spawnlocations.length)];
  return {
    x: x + xOffset,
    y
  };
}

function _getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
