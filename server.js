var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var log4js = require('log4js');
var logger = log4js.getLogger();
var port = 3000;
var people = {};
var connectCounter = 0;
var Ships = [];
var destroyShips = [];
var countShips = 20;

logger.level = 'debug';
logger.debug('Script has been started...');
server.listen(port);

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
  if (connectCounter < 2) {
    createGame(socket);
  }
});

function createGame(socket) {
  connectCounter = io.engine.clientsCount;
  Ships[socket.id] = [];
  destroyShips[socket.id] = [];
  var id = 'id_' + (socket.id).toString().substr(1, 4),
    name = 'U_' + connectCounter,
    sizeSpace = 10,
    numShips = 10,
    numOneShips = {
      1: 4,
      2: 3,
      3: 2,
      4: 1
    };
  createShips();
  console.log(Ships[socket.id]);
  socket.broadcast.emit('newUser', name);
  socket.emit('userName', {
    'name': name,
    'socketId': socket.id
  });
  logger.info(name + ' connected to chat!');

  socket.on('getShips', function (socketId) {
    logger.warn('-----------');
    logger.warn('UserId: ' + socketId);
    logger.warn('====> Getting Ships...');
    socket.emit('Ships', {
      'socketId': socketId,
      'ships': Ships[socketId]
    });
  });

  socket.on('message', function (msg) {
    logger.warn('-----------');
    logger.warn('User: ' + name + ' | Message: ' + msg);
    logger.warn('====> Sending message to other chater...');
    var time = (new Date).toLocaleTimeString();
    io.sockets.emit('messageToAponent', {
      'time': time,
      'msg': msg,
      'name': name
    });
  });

  socket.on('checkShot', function (data) {
    socket.broadcast.emit('checkShot', data);
  });

  socket.on('recheckShot', function (data) {
    var id = convertToID(data.c);
    if (id) {
      var hid = 'h_' + id;
      var loss = shot(hid, data.userId);
      socket.broadcast.emit('recheckShot', loss);
      socket.emit('reShot', loss);
    }

  });
  socket.on('shot', function (data) {
    socket.broadcast.emit('getId', destroyShips);
  });
  socket.on('getId', function (data) {
    if (destroyShips[data.userId] === countShips) {
      socket.emit('wasted', destroyShips);
      socket.broadcast.emit('victory', destroyShips);
    }
    socket.broadcast.emit('reShot', data);
  })
  socket.on('wasted', function (data) {
    socket.broadcast.emit('wasted', data);
  });

  function createShips() {
    for (floor in numOneShips) {
      var position;
      for (var i = 0; i < numOneShips[floor]; i++) {
        do {
          position = createShipPos(floor);
        } while (checkRepeatsPos(position, floor, numOneShips[floor]));
        Ships[socket.id].push({
          'position': position
        });
      }
    }
  }

  function createShipPos(floor) {
    var col = 0;
    var row = 0;
    var location = Math.floor(Math.random() * 2);
    var shipPosition = [];

    if (location === 1) { // horizontal
      row = Math.floor(Math.random() * sizeSpace);
      col = Math.floor(Math.random() * (sizeSpace - floor + 1));
    } else { // vertical
      row = Math.floor(Math.random() * (sizeSpace - floor + 1));
      col = Math.floor(Math.random() * sizeSpace);
    }

    for (var i = 0; i < floor; i++) {
      if (location === 1) {
        shipPosition.push("h_" + row + "" + (col + i));
      } else {
        shipPosition.push("h_" + (row + i) + "" + col);
      }
    };
    return shipPosition;
  }

  function checkRepeatsPos(position, floor, num) {
    for (var s = 0; s < Ships[socket.id].length; s++) {
      var spaceship = Ships[socket.id][s];
      for (var j = 0; j < position.length; j++) {
        if (typeof (spaceship) != 'undefined') {
          if (spaceship.position.indexOf(position[j]) >= 0) {
            return true;
          }
        }
      };
    };
    return false;
  }

  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function convertToID(c) {
    var symbol = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    if (c !== null && c.length === 2) {
      var firstChar = c.charAt(0);
      var row = symbol.indexOf(firstChar);
      var col = c.charAt(1);
      if (!isNumeric(row) || !isNumeric(col)) {
        logger.error('-----------');
        logger.error('Not Numeric!');
      } else if (row < 0 || row >= sizeSpace ||
        col < 0 || col >= sizeSpace) {
        logger.error('-----------');
        logger.error('Dump!');
      } else {
        return row + col;
      }
    } else {
      logger.error('-----------');
      logger.error('A - G!');
    }
    return null;
  }

  function shot(id, userId) {
    for (var i = 0; i < numShips; i++) {
      var ship = Ships[userId][i];
      var posDamage = ship.position.indexOf(id);
      if (posDamage >= 0) {
        destroyShips[userId]++;
        return {
          id: id.split('_')[1],
          status: 1
        };
      }
    };
    return id;
  }
}
