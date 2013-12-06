(function($) {

  var unit = 20;
  var KEY_CODES = {
    LEFT: 37,
    RIGHT: 39,
    DOWN: 40,
    UP: 38,
    SPACE: 32
  };

  var Tetris = function(options){
    this.$elem = $(options.elem);
    this.unitHeight = 25;
    this.unitWidth = 15;
    this.unit = unit;
    this.blocks = [];
    this.countRounds = 0;
    this.currentSpeed = 500;
    this.run();
  };

  Tetris.prototype.run = function() {
    this.draw();
    this.startRound();
  };

  Tetris.prototype.draw = function() {
    this.$elem.width(this.unitWidth * this.unit).height(this.unitHeight * this.unit)
    .css({
      // backgroundColor: 'gray',
      position: 'relative',
      margin: 0,
      padding: 0
    });
  };

  Tetris.prototype.startRound = function() {
    var self = this;
    var shapes = [I, J, O, S, T, L, Z];
    var angles = [0, 90, 180, 270];
    var randObject = Math.round(Math.random() * 10) % shapes.length;
    var randRotation = Math.round(Math.random() * 10) % angles.length;
    var shape = this.currentShape = new shapes[randObject]({rotation: angles[randRotation]});
    var shapeElems = shape.draw(this.$elem);

    $('body').on('keydown.tetris', function(e) {
      switch (e.keyCode) {
        case KEY_CODES.LEFT:
          self.moveCurrentShapeLeft();
          break;
        case KEY_CODES.RIGHT:
          self.moveCurrentShapeRight();
          break;
        case KEY_CODES.DOWN:
          self.setShapeInterval(20);
          $('body').one('keyup.tetris', function() {
            self.setShapeInterval(self.currentSpeed);
          });
          break;
        case KEY_CODES.SPACE:
          self.setShapeInterval(0);
          break;
        case KEY_CODES.UP:
          self.rotateCurrentShape();
          break;
      }
    });
    if (++this.countRounds % 10 === 0) {
      this.currentSpeed = Math.round(this.currentSpeed * 0.9);
    }
    this.setShapeInterval(this.currentSpeed);

  };

  Tetris.prototype.setShapeInterval = function(interval) {
    var self = this;
    clearInterval(this.interval);
    this.interval = setInterval(function() {
      self.moveCurrentShapeDown();
    }, interval);
  };

  Tetris.prototype.stopRound = function() {
    clearInterval(this.interval);
    $('body').off('keydown.tetris');
    var blocks = this.currentShape.blocks;
    for (var i = 0; i < blocks.length; i++) {
      this.blocks.push(blocks[i]);
    }
    this.currentShape = null;
  };

  Tetris.prototype.checkConflict = function(nextPositions) {
    for (var i = 0; i < nextPositions.length; i++) {
      var position = nextPositions[i];
      // check borders
      if (position.y >= this.unitHeight || position.x >= this.unitWidth || position.x < 0) {
        return true;
      }
      // check conflict with existing blocks
      for (var j = 0; j < this.blocks.length; j++) {
        if (this.blocks[j].x === position.x && this.blocks[j].y === position.y) {
          return true;
        }
      }
    }
    return false;
  };

  Tetris.prototype.moveCurrentShapeDown = function() {
    var nextPositions = this.currentShape.simulateMoveDown();
    if (!this.checkConflict(nextPositions)) {
      this.currentShape.moveDown();
    } else {
      this.bottomReached();
    }
  };

  Tetris.prototype.moveCurrentShapeRight = function() {
    var nextPositions = this.currentShape.simulateMoveRight();
    if (!this.checkConflict(nextPositions)) {
      this.currentShape.moveRight();
    }
  };

  Tetris.prototype.moveCurrentShapeLeft = function() {
    var nextPositions = this.currentShape.simulateMoveLeft();
    if (!this.checkConflict(nextPositions)) {
      this.currentShape.moveLeft();
    }
  };

  Tetris.prototype.rotateCurrentShape = function() {
    var nextPositions = this.currentShape.simulateRotateClockwise();
    if (!this.checkConflict(nextPositions)) {
      this.currentShape.rotateClockwise();
    }
  };

  Tetris.prototype.bottomReached = function() {
    var y = this.currentShape.currentY;
    this.stopRound();
    if (y === 0) {
      alert('GAME OVER');
    } else {
      this.removeFullLines();
      this.startRound();
    }
  };

  Tetris.prototype.removeFullLines = function() {
    var lines = {};
    for (var i = 0; i < this.blocks.length; i++) {
      var y = this.blocks[i].y;
      lines[y] = lines[y] || 0;
      lines[y]++;
      if (lines[y] === this.unitWidth) {
        this.removeLine(y);
        this.removeFullLines();
      }
    }
  };

  Tetris.prototype.removeLine = function(y) {
    var copy = [];
    for (var i = 0, l = this.blocks.length; i < l; i++) {
      if (this.blocks[i].y === y) {
        this.blocks[i].$elem.remove();
      }
      else {
        if (this.blocks[i].y < y) {
          this.blocks[i].moveDown();
        }
        copy.push(this.blocks[i]);
      }
    }
    this.blocks = copy;
  };


// SHAPE

  var Shape = function(options) {
    this.unit = unit;
    this.blocks = [];
    this.rotation = options.rotation;
    this.currentX = 0;
    this.currentY = 0;
  };

  Shape.extend = function(options) {
    var o = function() {
      Shape.apply(this, arguments);
      for (var i in options) {
        if (options.hasOwnProperty(i)){
          this[i] = options[i];
        }
      }
    };
    o.prototype = Shape.prototype;
    return o;
  };

  Shape.prototype.blockOptions = [];

  Shape.prototype.draw = function($elem) {
    var elems = [];
    for (var i = 0; i < this.blockOptions[this.rotation].length; i++) {
      var opts = this.blockOptions[this.rotation][i];
      var block = new Block({
        x: opts.x + this.currentX,
        y: opts.y + this.currentY,
        unit: this.unit,
        color: this.color
      });
      var elem = block.draw();
      this.blocks.push(block);
      $elem.append(elem);
    }
    this.$parentElem = $elem;
  };

  Shape.prototype.destroyBlocks = function() {
    for (var i = 0; i < this.blocks.length; i++) {
      this.blocks[i].$elem.remove();
    }
    this.blocks = [];
  };

  Shape.prototype.moveDown = function() {
    for (var i = 0; i < this.blocks.length; i++) {
      this.blocks[i].moveDown();
    }
    this.currentY++;
  };

  Shape.prototype.moveLeft = function() {
    for (var i = 0; i < this.blocks.length; i++) {
      this.blocks[i].moveLeft();
    }
    this.currentX--;
  };

  Shape.prototype.moveRight = function() {
    for (var i = 0; i < this.blocks.length; i++) {
      this.blocks[i].moveRight();
    }
    this.currentX++;
  };

  Shape.prototype.simulateMove = function(type) {
    var capitalized = type[0].toUpperCase() + type.substr(1);
    var opts = [];
    for (var i = 0; i < this.blocks.length; i++) {
      opts.push(this.blocks[i]['simulateMove' + capitalized]());
    }
    return opts;
  };

  Shape.prototype.simulateMoveDown = function() {
    return this.simulateMove('down');
  };

  Shape.prototype.simulateMoveRight = function() {
    return this.simulateMove('right');
  };

  Shape.prototype.simulateMoveLeft = function() {
    return this.simulateMove('left');
  };

  Shape.prototype.rotateClockwise = function() {
    this.rotation += 90;
    if (this.rotation > 270) {
      this.rotation = 0;
    }
    this.destroyBlocks();
    this.draw(this.$parentElem);
  };

  Shape.prototype.simulateRotateClockwise = function() {
    var rotation = this.rotation + 90;
    if (rotation > 270) {
      rotation = 0;
    }
    var opts = $.extend(true, [], this.blockOptions[rotation]);
    for (var i = 0; i < opts.length; i++) {
      opts[i].x += this.currentX;
      opts[i].y += this.currentY;
    }
    return opts;
  };





// BLOCK
  var Block = function(options){
    options = $.extend({
      x: 0,
      y: 0,
      unit: 10,
      color: 'white'
    }, options);
    this.x = options.x;
    this.y = options.y;
    this.unit = options.unit;
    this.color = options.color;
  };

  Block.prototype.draw = function() {
    this.$elem = $('<div>').width(this.unit).height(this.unit)
    .css({
      backgroundColor: this.color,
      position: 'absolute',
      left: (this.x * this.unit) + 'px',
      top: (this.y * this.unit) + 'px',
      border: 'solid black 1px',
      boxSizing: 'border-box'
    });
    return this.$elem;
  };

  Block.prototype.moveDown = function() {
    this.$elem.css({
      top: (++this.y * this.unit) + 'px'
    });
  };

  Block.prototype.moveLeft = function() {
    this.$elem.css({
      left: (--this.x * this.unit) + 'px'
    });
  };

  Block.prototype.moveRight = function() {
    this.$elem.css({
      left: (++this.x * this.unit) + 'px'
    });
  };

  Block.prototype.simulateMoveDown = function() {
    return { x: this.x, y: this.y + 1 };
  };

  Block.prototype.simulateMoveRight = function() {
    return { x: this.x + 1, y: this.y };
  };

  Block.prototype.simulateMoveLeft = function() {
    return { x: this.x - 1, y: this.y };
  };



  var O = Shape.extend({
    blockOptions: {
      0: [{ x: 0, y: 0 }, { x:1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
      90: [{ x: 0, y: 0 }, { x:1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
      180: [{ x: 0, y: 0 }, { x:1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
      270: [{ x: 0, y: 0 }, { x:1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]
    },
    color: 'red'
  });

  var J = Shape.extend({
    blockOptions: {
      0: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      90: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
      180: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }],
      270: [{ x: 0, y: 2 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
    },
    color: 'green'
  });

  var L = Shape.extend({
    blockOptions: {
      270: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
      180: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
      90: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
      0: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
    },
    color: 'green'
  });

  var S = Shape.extend({
    blockOptions: {
      0: [{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
      90: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
      180: [{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
      270: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
    },
    color: 'pink'
  });

  var Z = Shape.extend({
    blockOptions: {
      270: [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 0 }],
      180: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      90: [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 0 }],
      0: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
    },
    color: 'pink'
  });

  var T = Shape.extend({
    blockOptions: {
      0: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      90: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }],
      180: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }],
      270: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
    },
    color: 'yellow'
  });

  var I = Shape.extend({
    blockOptions: {
      0: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
      90: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
      180: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
      270: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]
    },
    color: 'blue'
  });


  $(function() {
    new Tetris({
      elem: '#grid'
    });
  });
}(jQuery));
