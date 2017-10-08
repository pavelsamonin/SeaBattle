var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var log4js = require('log4js');
var logger = log4js.getLogger();
var port = 3000;
var people = {};
var connectCounter = 0;
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
  var name = 'U' + (socket.id).toString().substr(1, 4);
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
    var time = (new Date).toLocaleTimeString();
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
