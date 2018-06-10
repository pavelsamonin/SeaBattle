const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const log4js = require('log4js');
const logger = log4js.getLogger();
const port = 3000;
let people = {};
let connectCounter = 0;
logger.level = 'debug';
logger.debug('Script has been started...');
server.listen(port);

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
  if (connectCounter < 3) {
    createGame(socket);
  }
});

function createGame(socket) {
  let name = 'U' + (socket.id).toString().substr(1, 4);
  connectCounter = io.engine.clientsCount;
  socket.broadcast.emit('newUser', name);
  socket.emit('userName', {
    'name': name,
    'socketId': socket.id
  });
  logger.info(name + ' connected to chat!');
  socket.on('message', function (msg) {
    logger.warn('-----------');
    logger.warn('User: ' + name + ' | Message: ' + msg);
    logger.warn('====> Sending message to other chater...');
    let time = (new Date).toLocaleTimeString();
    io.sockets.emit('messageToAponent', {
      'time': time,
      'msg': msg,
      'name': name
    });
  });
  socket.on('checkShot', function (data) {
    socket.broadcast.emit('recheckShot', data);
  });
  socket.on('shot', function (data) {
    socket.broadcast.emit('reShot', data);
  });
  socket.on('wasted', function (data) {
    socket.broadcast.emit('wasted', data);
  });
}
