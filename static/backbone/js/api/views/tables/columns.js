/* Useful Websites:
 * http://backgridjs.com/ref/column.html#getting-the-column-definitions-from-the-server
 http://stackoverflow.com/questions/13358477/override-backbones-collection-fetch
 */
var collection;
define([
    "jquery",
    "backgrid",
    "models/field",
    "lib/tables/cells/delete",
    "lib/tables/cells/image-cell",
    "lib/tables/cells/audio-cell",
    "lib/tables/formatters/lat",
    "lib/tables/formatters/lng"
], function ($, Backgrid, Field, DeleteCell, ImageCell, AudioCell, LatFormatter, LngFormatter) {
    "use strict";
    var Columns = Backgrid.Columns.extend({
            url: null,
            //model: Field,
            initialize: function (opts) {
                opts = opts || {};
                var that = this;
                $.extend(this, opts);
                if (!this.url) {
                    alert("opts.url cannot be null");
                }
                this.fetch({set: true, success: function () {
                    that.addExtras();
                }});
                //this.on('reset', this.addExtras, this);
                this.globalEvents.on("add-to-columns", function (model) {
                    model = that.conformRecordToModel(model);
                    that.add(model);
                    console.log(that);
                });
            },
            conformRecordToModel: function (model) {
                model.set("label", model.get("col_alias"));
                model.set("name", model.get("col_name"));
                model.set("width", 200); //Math.min(model.get("display_width"), 100));
                model.set("headerCell", Columns.HeaderCell);
                model.set("cell", this.wrapCell(Backgrid.StringCell));
                return model;
            },
            parse: function (response) {
                return response.results;
            },
            showColumn: function (key) {
                // check that doesn't end with the string "_detail."
                if (!/(^\w*_detail$)/.test(key)) {
                    return true;
                }
                return false;
            },
            addExtras: function () {
                var that = this;
                this.each(function (model) {
                    model = that.conformRecordToModel(model);
                });
                console.log(this.models);
                console.log(Columns.getLngCell());
                var cell1 = _.extend(Columns.getLngCell(), {id: parseInt(Math.random() * 10000) });
                var cell2 = _.extend(Columns.getLatCell(), {id: parseInt(Math.random() * 10000) });
                var cell3 = _.extend(Columns.getDeleteCell(), {id: parseInt(Math.random() * 10000) });
                //cell.cell = this.wrapCell(cell.cell);
                this.add(cell1, {at: 0});
                this.add(cell2, {at: 0});
                this.add(cell3, {at: 0});
            },

            wrapCell: function (Cell) {
                //wraps each cell in an overflow div in order for column adjusting
                //to work
                var newCell = Cell.extend({
                    render: function () {
                        Cell.prototype.render.call(this, arguments);
                        var idx = this.$el.index(),
                            width = $('.backgrid').find("thead th:nth-child(" + (idx + 1) + ")").width();
                        //console.log(width);
                        this.$el.html(
                            $('<div class="hide-overflow"></div>')
                                .append(this.$el.html())
                                .width(width)
                        );
                        return this;
                    }
                });
                return newCell;
            }
        },
            // static methods are the second arguments.
            // Note that this class is made up primarily of
            // static methods:
            {
                defaultCellType: { cell: Backgrid.StringCell, width: 200 },
                getDefaultCell: function (name, opts) {
                    //alert(opts.type + " - " + Columns.cellTypeByNameLookup[opts.type]);
                    var defaultCell = {
                        name: name,
                        label: opts.label,
                        editable: !opts.read_only,
                        headerCell: Columns.HeaderCell
                    };
                    $.extend(defaultCell, Columns.cellTypeByNameLookup[opts.type] || Columns.defaultCellType);
                    return defaultCell;
                },
                getDeleteCell: function () {
                    return {
                        name: "delete",
                        label: "delete",
                        editable: false,
                        cell: DeleteCell,
                        width: 40,
                        headerCell: Columns.HeaderCell
                    };
                },
                getLatCell: function () {
                    return {
                        name: "latitude",
                        label: "Latitude",
                        cell: Backgrid.NumberCell,
                        formatter: LatFormatter,
                        editable: true,
                        width: 80,
                        headerCell: Columns.HeaderCell
                    };
                },
                getLngCell: function () {
                    return {
                        name: "longitude",
                        label: "Longitude",
                        cell: Backgrid.NumberCell,
                        formatter: LngFormatter,
                        editable: true,
                        width: 80,
                        headerCell: Columns.HeaderCell
                    };
                },
                generateColumnsFromField: function (k, opts) {
                    var cols = [], cell, optionValues = [];
                    if (opts.type == 'geojson') {
                        cols.push(Columns.getLatCell());
                        cols.push(Columns.getLngCell());
                    } else if (opts.type === 'select') {
                        cols.push({
                            name: k,
                            label: opts.label,
                            cell: Backgrid.SelectCell.extend({
                                optionValues: opts.optionValues
                            }),
                            editable: true,
                            width: 150,
                            headerCell: Columns.HeaderCell
                        });
                    } else if (opts.type == 'photo') {
                        cols.push({
                            name: k,
                            label: opts.label,
                            cell: ImageCell,
                            editable: true, //false
                            width: 140,
                            headerCell: Columns.HeaderCell
                        });
                    } else if (opts.type == 'audio') {
                        cols.push({
                            name: k,
                            label: opts.label,
                            cell: AudioCell,
                            editable: true, //false,
                            width: 140,
                            headerCell: Columns.HeaderCell
                        });
                    } /*else if (opts.type == 'field' && opts.choices) {
                        _.each(opts.choices, function (choice) {
                            optionValues.push([choice.display_name, choice.value]);
                        });
                        cols.push({
                            name: k,
                            label: opts.label,
                            cell: Backgrid.SelectCell.extend({
                                optionValues: optionValues
                            }),
                            editable: true,
                            width: 140,
                            headerCell: Columns.HeaderCell
                        });
                    }*/ else {
                        cell = Columns.getDefaultCell(k, opts);
                        if (k == 'id') {
                            cell.width = 30;
                        }
                        cols.push(cell);
                    }
                    return cols;
                },
                cellTypeByNameLookup: {
                    "integer": { cell: Backgrid.IntegerCell, width: 120 },
                    "field": { cell: Backgrid.StringCell, width: 200 },
                    "boolean": { cell: Backgrid.BooleanCell, width: 100 },
                    "decimal": { cell: Backgrid.NumberCell, width: 120 },
                    "date-time": { cell: Backgrid.DatetimeCell, width: 100 },
                    "rating": { cell: Backgrid.IntegerCell, width: 120 },
                    "string": { cell: Backgrid.StringCell, width: 200 },
                    "memo": { cell: Backgrid.StringCell, width: 200 },
                    "float": { cell: Backgrid.NumberCell, width: 120 }
                },
                cellTypeByIdLookup: {
                    "1": Backgrid.SelectCell, //"string",
                    "2": Backgrid.IntegerCell,
                    "3": Backgrid.DatetimeCell,
                    "4": Backgrid.BooleanCell,
                    "5": Backgrid.NumberCell,
                    "6": Backgrid.IntegerCell
                },
                HeaderCell: Backgrid.HeaderCell.extend({
                    events: {
                        "click a.sorter": "onClick",
                        "click i.fa-trash-o": "deleteColumn"
                    },
                    deleteColumn: function () {
                        this.column.destroy();
                    },
                    render: function () {
                        //console.log(this.column);
                        this.$el.empty();
                        var column = this.column,
                            sortable = Backgrid.callByNeed(column.sortable(), column, this.collection),
                            label;
                        if (sortable) {
                            label = $("<a class='sorter'>").text(column.get("name")).append("<b class='sort-caret'></b>");
                        } else {
                            label = document.createTextNode(column.get("label"));
                        }
                        this.$el.append(
                            $('<div class="column-menu"></div>')
                                //.html(column.get("label"))
                                .append($('<i class="fa fa-trash-o" style="cursor:pointer;"></i>'))
                        );
                        this.$el.append(label);
                        this.$el.addClass(column.get("name"));
                        this.$el.addClass(column.get("direction"));
                        this.delegateEvents();
                        return this;
                    }
                })
            });
    return Columns;
});
