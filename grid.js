function Grid(width, height) {
  var g = [];
  for (var i = 0; i < height; i++) {
    g.push([]);
    for (var j = 0; j < width; j++) {
      g[i].push({});
    }
  }
  this.grid = g;
  this.width = width;
  this.height = height;
}

Grid.prototype = {
  constructor: Grid,
  addRow: function () {
    var newRow = [];
    for (var i = 0; i < this.width; i++) {
      newRow.push({});
    }
    this.grid.push(newRow);
    this.height += 1;
  },
  addColumn: function () {
    for (var i = 0; i < this.height; i++) {
      this.grid[i].push({});
    }
    this.width += 1;
  },
  removeRow: function() {
    this.height -= 1;
    this.grid.length = this.height;
  },
  removeColumn: function() {
    this.width -= 1;
    for (var i = 0; i < this.height; i++) {
      this.grid[i].length = this.width;
    }
  },
  setDimensions: function(w, h) {
    if (w > this.width) {
      while (this.width != w) {
        this.addColumn();
      }
    } else {
      while (this.width != w) {
        this.removeColumn();
      }
    }

    if (h > this.height) {
      while (this.height != h) {
        this.addRow();
      }
    } else {
      while (this.height != h) {
        this.removeRow();
      }
    }
  }
}
