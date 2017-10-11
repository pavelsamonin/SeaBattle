var port = 3000;
var socket = io.connect('http://localhost:' + port);
var userId = null;
var view = {
  showShip: function (player, id, color) {
    var elShip = document.getElementById(id);
    elShip.setAttribute("class", color);
  },
  showBomb: function (id) {
    var elBomb = document.getElementById(id);
    elBomb.setAttribute("class", "bomb");
  }
};

var Ships = [];

var controller = {
  shotShip: function (c) {
    var data = {
      'c': c,
      'userId': userId
    }
    socket.emit('checkShot', data);
  },
  checkShot: function (c) {
    var data = {
      'c': c.c,
      'userId': userId
    }
    socket.emit('recheckShot', data);
  },

  recheckShot: function (loss) {
    if (loss.status === 1) {
      view.showShip("area_home", loss.id, "ship-red");
    } else if (typeof (loss) == 'string') {
      view.showBomb(loss.split('_')[1]);
    }
    var data = {
      'loss': loss,
      'userId': userId
    }
    socket.emit('shot', data);
  },

  getId: function () {
    var data = {
      'userId': userId
    }
    socket.emit('getId', data);
  },

  reShot: function (loss) {
    if (loss.status === 1) {
      view.showShip("area_enemy", "h_" + loss.id, "ship-red");
    } else if (typeof (loss) == 'string') {
      view.showBomb(loss);
    }
  },

  wasted: function functionName(data) {
    alert("Wasted!");
  },

  victory: function functionName(data) {
    alert("Victory!");
  },

  convertToID: function (c) {
    var symbol = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    if (c !== null && c.length === 2) {
      var firstChar = c.charAt(0);
      var row = symbol.indexOf(firstChar);
      var col = c.charAt(1);
      if (!this.isNumeric(row) || !this.isNumeric(col)) {
        alert("Not Numeric!");
      } else if (row < 0 || row >= model.sizeSpace ||
        col < 0 || col >= model.sizeSpace) {
        alert("Dump!");
      } else {
        return row + col;
      }
    } else {
      alert("A - G!");
    }
    return null;
  },

  isNumeric: function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },

  hoverClick: function (id) {
    var el = document.getElementById(id);
    el.onmouseover = function (e) {
      e = e || window.event;
      if (e.target.id !== "") {
        // if(model.click == true){
        e.target.style.transition = "0.5s";
        e.target.style.backgroundColor = "rgba(104, 142, 218, 0.33)";
        e.target.onclick = function () {
          var c = this.getAttribute("data-title");
          controller.shotShip(c)
        };
      }
      // }
    };
    el.onmouseout = function (e) {
      e = e || window.event;
      if (e.target.id !== "") {
        e.target.style.backgroundColor = "inherit";
      }
    };
  },

  createDataTitle: function () {
    var elCell = document.getElementsByTagName("td");
    for (var i = 0; i < elCell.length; i++) {
      if (elCell[i].id !== "") {
        var value = elCell[i].getAttribute("id");
        var element = elCell[i];
        var letter = element.parentNode.firstElementChild.firstElementChild.innerHTML;
        elCell[i].setAttribute("data-title", letter + value.charAt(1));
      }
    };
  }
};

(function () {
  var start = {
    init: function () {
      this.main();
      this.event();
    },
    main: function () {
      $(document).on('click', 'button', function () {
        var message = $('input').val();
        socket.emit('message', message);
        $('input').val(null);
      });
    },
    event: function () {
      socket.on('userName', function (data) {
        console.log('You\'r username is => ' + data.name);
        $('textarea').val($('textarea').val() + 'You\'r username => ' + data.name + '\n' + 'You\'r socketId => ' + data.socketId + '\n');
        userId = data.socketId;
        socket.emit('getShips', data.socketId);
      });
      socket.on('newUser', function (userName) {
        console.log('New user has been connected to chat | ' + userName);
        $('textarea').val($('textarea').val() + userName + ' connected!\n');
      });

      socket.on('messageToAponent', function (data) {
        console.log(data.name + ' | => ' + data.msg + ' - time: ' + data.time);
        $('textarea').val($('textarea').val() + data.name + ' : ' + data.msg + ' - ' + data.time + '\n');
      });

      socket.on('Ships', function (data) {
        var ships = data.ships;
        for (var i = 0, len = ships.length; i < len; i++) {
          var ship = ships[i].position;
          for (p in ship) {
            view.showShip("area_home", ship[p], "ship-blue");
          }
        }
        (function createDataTitle() {
          var elCell = document.getElementsByTagName("td");
          for (var i = 0; i < elCell.length; i++) {
            if (elCell[i].id !== "") {
              var value = elCell[i].getAttribute("id");
              var element = elCell[i];
              var letter = element.parentNode.firstElementChild.firstElementChild.innerHTML;
              elCell[i].setAttribute("data-title", letter + value.charAt(1));
            }
          };
        })();
      });

      socket.on('checkShot', function (data) {
        controller.checkShot(data);
      });

      socket.on('getId', function (data) {
        controller.getId(data);
      });

      socket.on('recheckShot', function (data) {
        controller.recheckShot(data);
      });

      socket.on('reShot', function (data) {
        controller.reShot(data);
      });

      socket.on('wasted', function (data) {
        controller.wasted(data);
      });

      socket.on('victory', function (data) {
        controller.victory(data);
      });

      controller.hoverClick("area_enemy");
    }
  }
  start.init();
}());
