/*!
 * jQuery-Seat-Charts v1.1.1
 * https://github.com/mateuszmarkowski/jQuery-Seat-Charts
 *
 * Copyright 2013, 2014 Mateusz Markowski
 * Released under the MIT license
 *
 * Modified by Attendance Project/Ray Li
 */



(function($) {

  //'use strict';

  $.fn.seatCharts = function (setup) {

    //if there's seatCharts object associated with the current element, return it
    // if (this.data('seatCharts')) {
    //  return this.data('seatCharts');
    // }

    var fn       = this,
      seats    = {},
      seatIds  = [],
      legend,
      settings = {
        animate : false, //requires jQuery UI
        hideEmptySeats: false,
        naming  : {
          top    : true,
          left   : true,
          getId  : function(character, row, column) {
            return row + '_' + column;
          },
          getLabel : function (character, row, column) {
            return column;
          }

        },
        legend : {
          node   : null,
          items  : []
        },
        click   : function(e, elem) {

          console.log('default function', e, elem);

        },
        right_click : function (e, elem) {

          console.log('right click default', e, elem);

        },
        tap_hold  : function (e, elem) {

          console.log('tap hold default', e, elem);

        },
        focus  : function() {

        },
        blur   : function() {
        },
        seats   : {}

      };

      var setCurrentCell = function(cur) {
        $('.focused').removeClass('focused');
        fn.currentCell = cur;
        $(cur).addClass('focused');
      }

      var getRowCol = function(row, col) {
        return $('#' + row + '_' + col);
      }

      //seat will be basically a seat object which we'll when generating the map
      var seat = (function(seatCharts, seatChartsSettings) {
        return function (setup) {
          var fn = this;

          fn.settings = $.extend({
            status : 'available', //available, unavailable, selected
            style  : 'available',
            //make sure there's an empty hash if user doesn't pass anything
            // data   : seatChartsSettings.seats || {}
            //anything goes here?
          }, setup);

          fn.settings.$node = $('<div></div>');

          fn.settings.$node
            .attr({
              id             : fn.settings.id,
              role           : 'checkbox',
              'aria-checked' : false,
              focusable      : false,
              tabIndex       : -1 //manual focus
            })

            .text(fn.settings.data.name)
            .addClass(['seatCharts-seat', 'seatCharts-cell', 'available', 'notSelectable'].concat(
              //let's merge custom user defined classes with standard JSC ones
              fn.settings.classes,
              typeof fn.settings.data.classes == "undefined" ?
                [] : fn.settings.data.classes
              ).join(' '));

          //basically a wrapper function
          fn.data = function() {
            return fn.settings.data;
          };

          fn.char = function() {
            return fn.settings.character;
          };

          fn.node = function() {
            return fn.settings.$node;
          };

          /*
           * Can either set or return status depending on arguments.
           *
           * If there's no argument, it will return the current style.
           *
           * If you pass an argument, it will update seat's style
           */
          fn.style = function() {

            return arguments.length == 1 ?
              (function(newStyle) {
                var oldStyle = fn.settings.style;

                //if nothing changes, do nothing
                if (newStyle == oldStyle) {
                  return oldStyle;
                }

                //focused is a special style which is not associated with status
                fn.settings.status = newStyle != 'focused' ? newStyle : fn.settings.status;
                fn.settings.$node
                  .attr('aria-checked', newStyle == 'selected');

                //if user wants to animate status changes, let him do this
                seatChartsSettings.animate ?
                  fn.settings.$node.switchClass(oldStyle, newStyle, 200) :
                  fn.settings.$node.removeClass(oldStyle).addClass(newStyle);

                return fn.settings.style = newStyle;
              })(arguments[0]) : fn.settings.style;
          };

          //either set or retrieve
          fn.status = function() {

            return fn.settings.status = arguments.length == 1 ?
              fn.style(arguments[0]) : fn.settings.status;
          };

        }
      })(fn, settings);

    fn.addClass('seatCharts-container');

    var clickTimer;
    var mouseButton;
    var triggered = false;

    //true -> deep copy!
    $.extend(true, settings, setup);
    var events = 'touchstart touchend mouseup mousedown contextmenu';
    console.log('events', events)
    /*
      Order of click events on mobile(touchscreens)
      Source: http://www.html5rocks.com/en/mobile/touchandmouse/
      1. touchstart
      2. touchmove
      3. touchend
      4. mouseover
      5. mousemove
      6. mousedown
      7. mouseup
      8. click
     */
    $('body').off(events)
      .on(events, '.seatCharts-seat', function(e) {
        e.preventDefault(); //Do this so that touchevents wont bubble up to produce click events
        fn.currentCell = $(e.currentTarget);
        mouseButton = e.which;
        console.log('e.type', e.type, e)
        if(e.type == 'mouseup' || e.type == 'touchend'){
          clearTimeout(clickTimer);
          if(!triggered){
            console.log('not triggered', e)
            if(mouseButton == 1 || mouseButton == undefined || e.type == 'touchend') {
              settings.click(e, e.currentTarget);
              console.log('left click')
            } else if (mouseButton == 3) {
              console.log('right click')
              settings.right_click(e, e.currentTarget);
            }
          }
          triggered = false;
          // return false;
        }
        if(e.type == 'mousedown' || e.type == 'touchstart'){
          console.log('mousedown')
          clickTimer = window.setTimeout(function(){
            settings.tap_hold(e, e.currentTarget);
            triggered = true;
          }, 750);
          // return false;
        }
        if(e.type == 'contextmenu'){
          return false;
        }

      })
      .on('mouseenter', '.seatCharts-seat', function(e) {
        setCurrentCell($(e.currentTarget));
      });;


    $(document).on('keydown', function (e) {

      if ($(e.target).is('input, textarea')) {
        return true;
      }

      //everything depends on the pressed key
      switch (e.which) {
        //spacebar will just trigger the same event mouse click does
        case 32:
        case 13:
          e.preventDefault();
          console.log('space/enter', fn.currentCell);
          $(fn.currentCell).mouseup();
          break;
        //UP & DOWN
        case 40:
        case 38:
          e.preventDefault();

          var map = settings.map,
              row, col;

          if (!fn.currentCell || !fn.currentCell.attr('id')) {
            // if blank, default to 0
            console.log('currentCell is null');

            row = 0;
            col = 0;
          } else {
            var rc_list = fn.currentCell.attr('id').split('_');
            row = rc_list[0] - 1;
            col = rc_list[1] - 1;

            if (e.which == 38) {
              console.log('up');
              row = (map.height + row - 1) % map.height;
            } else {
              console.log('down');
              row = (row + 1) % map.height;
            }
          }

          setCurrentCell(getRowCol(row + 1, col + 1));

          break;
        //LEFT & RIGHT
        case 37:
        case 39:
          e.preventDefault();

          var map = settings.map,
              row, col;

          if (!fn.currentCell || !fn.currentCell.attr('id')) {
            // if blank, default to 0
            console.log('currentCell is null');

            row = 0;
            col = 0;
          } else {
            var rc_list = fn.currentCell.attr('id').split('_');
            row = rc_list[0] - 1;
            col = rc_list[1] - 1;

            if (e.which == 37) {
              console.log('left');
              col = (map.width + col - 1) % map.width;
            } else {
              console.log('right');
              col = (col + 1) % map.width;
            }
          }

          setCurrentCell(getRowCol(row + 1, col + 1));

          break;
        default:
          break;

      }
    });

    //Generate default row ids unless user passed his own
    settings.naming.rows = settings.naming.rows || (function(length) {
      var rows = [];
      for (var i = 1; i <= length; i++) {
        rows.push(i);
      }
      return rows;
    })(settings.map.height);

    //Generate default column ids unless user passed his own
    settings.naming.columns = settings.naming.columns || (function(length) {
      var columns = [];
      for (var i = 1; i <= length; i++) {
        columns.push(i);
      }
      return columns;
    })(settings.map.width);

    if (settings.naming.top) {
      var $headerRow = $('<div></div>')
        .addClass('seatCharts-row seatCharts-header');

      if (settings.naming.left) {
        $headerRow.append($('<div></div>').addClass('seatCharts-cell'));
      }


      $.each(settings.naming.columns, function(index, value) {
        $headerRow.append(
          $('<div></div>')
            .addClass('seatCharts-cell')
            .text(value)
        );
      });
    }

    fn.append($headerRow);

    //do this for each map row
    $.each(settings.map.grid, function(row, list) {

      var $row = $('<div></div>').addClass('seatCharts-row');

      if (settings.naming.left) {
        $row.append(
          $('<div></div>')
            .addClass('seatCharts-cell seatCharts-space')
            .text(settings.naming.rows[row])
        );
      }

      /*
       * Do this for each seat (letter)
       *
       * Now users will be able to pass custom ID and label which overwrite the one that seat would be assigned by getId and
       * getLabel
       *
       * New format is like this:
       * a[ID,label]a[ID]aaaaa
       *
       * So you can overwrite the ID or label (or both) even for just one seat.
       * Basically ID should be first, so if you want to overwrite just label write it as follows:
       * a[,LABEL]
       *
       * Allowed characters in IDs areL 0-9, a-z, A-Z, _
       * Allowed characters in labels are: 0-9, a-z, A-Z, _, ' ' (space)
       *
       */

      $.each(list, function (column, cell) {

        $row.append((!settings.hideEmptySeats || cell.pk) ?
          //if the character is not an underscore (empty space)
          (function(naming) {

            //so users don't have to specify empty objects
            // settings.seats[character] = character in settings.seats ? settings.seats[character] : {};

            var id = naming.getId('a', naming.rows[row], naming.columns[column]);
            seats[id] = new seat({
              id        : id,
              label     : naming.getLabel('a', naming.rows[row], naming.columns[column]),
              row       : row,
              column    : column,
              character : 'a',
              data      : cell
              // map       : settings.map.grid[row][column]
            });

            seatIds.push(id);
            return seats[id].node();

          })(settings.naming) :
          //this is just an empty space (_)
          $('<div></div>').addClass('seatCharts-cell seatCharts-space')
        );
      });

      fn.append($row);
    });


    fn.attr({
      tabIndex : 0
    });


    //when container's focused, move focus to the first seat
    fn.focus(function() {

    });

    //public methods of seatCharts
    fn.data('seatCharts', {
      seats   : seats,
      seatIds : seatIds,
      //set for one, set for many, get for one
      status: function() {
        var fn = this;

        return arguments.length == 1 ? fn.seats[arguments[0]].status() : (function(seatsIds, newStatus) {

          return typeof seatsIds == 'string' ? fn.seats[seatsIds].status(newStatus) : (function() {
            $.each(seatsIds, function(index, seatId) {
              fn.seats[seatId].status(newStatus);
            });
          })();
        })(arguments[0], arguments[1]);
      },
      each  : function(callback) {
        var fn = this;

        for (var seatId in fn.seats) {
          if (false === callback.call(fn.seats[seatId], seatId)) {
            return seatId;//return last checked
          }
        }

        return true;
      },
      node       : function() {
        var fn = this;
        //basically create a CSS query to get all seats by their DOM ids
        return $('#' + fn.seatIds.join(',#'));
      },

      find       : function(query) {//D, a.available, unavailable
        var fn = this;

        var seatSet = fn.set();

        //user searches just for a particual character
        return query.length == 1 ? (function(character) {
          fn.each(function() {
            if (this.char() == character) {
              seatSet.push(this.settings.id, this);
            }
          });

          return seatSet;
        })(query) : (function() {
          //user runs a more sophisticated query, so let's see if there's a dot
          return query.indexOf('.') > -1 ? (function() {
            //there's a dot which separates character and the status
            var parts = query.split('.');

            fn.each(function(seatId) {
              if (this.char() == parts[0] && this.status() == parts[1]) {
                seatSet.push(this.settings.id, this);
              }
            });

            return seatSet;
          })() : (function() {
            fn.each(function() {

              if (this.status() == query) {
                seatSet.push(this.settings.id, this);
              }
            });

            return seatSet;
          })();
        })();

      },
      set        : function set() {//inherits some methods
        var fn = this;

        return {
          seats      : [],
          seatIds    : [],
          length     : 0,
          status     : function() {
            var args = arguments,
              that = this;
            //if there's just one seat in the set and user didn't pass any params, return current status
            return this.length == 1 && args.length == 0 ? this.seats[0].status() : (function() {
              //otherwise call status function for each of the seats in the set
              $.each(that.seats, function() {
                this.status.apply(this, args);
              });
            })();
          },
          node       : function() {
            return fn.node.call(this);
          },
          each       : function() {
            return fn.each.call(this, arguments[0]);
          },
          get        : function() {
            return fn.get.call(this, arguments[0]);
          },
          find       : function() {
            return fn.find.call(this, arguments[0]);
          },
          set       : function() {
            return set.call(fn);
          },
          push       : function(id, seat) {
            this.seats.push(seat);
            this.seatIds.push(id);
            ++this.length;
          }
        };
      },
      //get one object or a set of objects
      get   : function(seatsIds) {
        var fn = this;

        return typeof seatsIds == 'string' ?
          fn.seats[seatsIds] : (function() {

            var seatSet = fn.set();

            $.each(seatsIds, function(index, seatId) {
              if (typeof fn.seats[seatId] === 'object') {
                seatSet.push(seatId, fn.seats[seatId]);
              }
            });

            return seatSet;
          })();
      }
    });

    return fn.data('seatCharts');
  }


})(jQuery);
