var port = 3000;
var socket = io.connect('http://localhost:' + port);

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

var model = {
  sizeSpace: 10,
  numShips: 10,
  numOneShips: {
    1: 4,
    2: 3,
    3: 2,
    4: 1
  },
  destroyShips: 0,
  countShips: 20,
  spaceships: [],
  shot: function (id) {
    for (var i = 0; i < this.numShips; i++) {
      var spaceship = this.spaceships[i];
      var posDamage = spaceship.position.indexOf(id);
      if (posDamage >= 0) {
        this.destroyShips++;
        return {
          id: id.split('_')[1],
          status: 1
        };
      }
    };
    return id;
  },

  createShipPos: function (floor) {
    var col = 0;
    var row = 0;
    var location = Math.floor(Math.random() * 2);
    var shipPosition = [];

    if (location === 1) { // horizontal
      row = Math.floor(Math.random() * this.sizeSpace);
      col = Math.floor(Math.random() * (this.sizeSpace - floor + 1));
    } else { // vertical
      row = Math.floor(Math.random() * (this.sizeSpace - floor + 1));
      col = Math.floor(Math.random() * this.sizeSpace);
    }

    for (var i = 0; i < floor; i++) {
      if (location === 1) {
        shipPosition.push("h_" + row + "" + (col + i));
      } else {
        shipPosition.push("h_" + (row + i) + "" + col);
      }
    };
    return shipPosition;
  },

  checkRepeatsPos: function (position, floor, num) {
    for (var s = 0; s < this.spaceships.length; s++) {
      var spaceship = this.spaceships[s];
      for (var j = 0; j < position.length; j++) {
        if (typeof (spaceship) != 'undefined') {
          if (spaceship.position.indexOf(position[j]) >= 0) {
            return true;
          }
        }
      };
    };
    return false;
  },

  createSpaceships: function (floor, num) {
    var position;
    for (var i = 0; i < num; i++) {
      do {
        position = this.createShipPos(floor);
      } while (this.checkRepeatsPos(position, floor, num));
      for (p in position) {
        view.showShip("area_home", position[p], "ship-blue");
      }
      this.spaceships.push({
        'position': position
      });

    };
  }
};

var controller = {
  createShips: function () {
    for (floor in model.numOneShips) {
      model.createSpaceships(floor, model.numOneShips[floor]);
    }
  },

  shotShip: function (c) {
    var id = this.convertToID(c);
    if (id) {
      socket.emit('checkShot', id);
    }
  },

  recheckShot: function (id) {
    var id = 'h_' + id;
    var loss = model.shot(id);
    if (loss.status === 1) {
      view.showShip("area_home", "h_" + loss.id, "ship-red");
    } else if (typeof (loss) == 'string') {
      view.showBomb(loss);
    }
    socket.emit('shot', loss);
    if (model.destroyShips === model.countShips) {
      socket.emit('wasted', model.destroyShips);
      alert("Wasted!");
    }
  },

  reShot: function (loss) {
    if (loss.status === 1) {
      view.showShip("area_enemy", loss.id, "ship-red");
    } else if (typeof (loss) == 'string') {
      view.showBomb(loss.split('_')[1]);
    }
  },

  wasted: function functionName(data) {
    if (data === model.countShips) {
      alert("Victory!");
    }
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
        e.target.style.transition = "0.5s";
        e.target.style.backgroundColor = "rgba(104, 142, 218, 0.33)";
        e.target.onclick = function () {
          var c = this.getAttribute("data-title");
          controller.shotShip(c)
        };
      }
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
      this.control();
      this.event();
    },
    main: function () {
      $(document).on('click', 'button', function () {
        var message = $('input').val();
        socket.emit('message', message);
        $('input').val(null);
      });
    },
    control: function () {
      controller.createShips();
      controller.createDataTitle();
    },
    event: function () {
      socket.on('userName', function (data) {
        console.log('You\'r username is => ' + data.name);
        $('textarea').val($('textarea').val() + 'You\'r username => ' + data.name + '\n' + 'You\'r socketId => ' + data.socketId + '\n');
      });
      socket.on('newUser', function (userName) {
        console.log('New user has been connected to chat | ' + userName);
        $('textarea').val($('textarea').val() + userName + ' connected!\n');
      });

      socket.on('messageToAponent', function (data) {
        console.log(data.name + ' | => ' + data.msg + ' - time: ' + data.time);
        $('textarea').val($('textarea').val() + data.name + ' : ' + data.msg + ' - ' + data.time + '\n');
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

      controller.hoverClick("area_enemy");
    }
  }
  start.init();
}());
