define(["marionette",
        "underscore",
        "handlebars",
        "collections/photos",
        "collections/audio",
        "collections/fields",
        "collections/records",
        "collections/markers",
        "models/record",
        "models/marker",
        "apps/spreadsheet/views/create-field",
        "handsontable",
        "text!../templates/spreadsheet.html"],
    function (Marionette, _, Handlebars, Photos, Audio, Fields, Records, Markers,
              Record, Marker, CreateFieldView, Handsontable, SpreadsheetTemplate) {
        'use strict';
        var Spreadsheet = Marionette.ItemView.extend({
            template: function () {
                return Handlebars.compile(SpreadsheetTemplate);
            },
            table: null,
            events: {
                'click #addColumn': 'showCreateFieldForm',
                'click .delete_column' : 'deleteField'
            },
            initialize: function (opts) {
                _.extend(this, opts);

                // call Marionette's default functionality (similar to "super")
                Marionette.ItemView.prototype.initialize.call(this);
                this.displaySpreadsheet();

                //listen to events that fire from other parts of the application:
                this.listenTo(this.app.vent, 'search-requested', this.doSearch);
                this.listenTo(this.app.vent, 'clear-search', this.clearSearch);
                this.listenTo(this.app.vent, "render-spreadsheet", this.renderSpreadsheet);
                this.listenTo(this.app.vent, "add-row", this.addRow);
            },
            displaySpreadsheet: function () {
                //fetch data from server according to mode:
                var that = this,
                    id;
                if (this.app.dataType == "photos") {
                    this.collection = new Photos();
                } else if (this.app.dataType ==  "audio") {
                    this.collection = new Audio();
                } else if (this.app.dataType == "markers") {
                    //alert("show 'markers' spreadsheet");
                    this.collection = new Markers();
                } else if (this.app.dataType.indexOf("form_") != -1) {
                    id = this.app.dataType.split("_")[1];
                    // column names:
                    this.fields = new Fields(null, {
                        id: id
                    });
                    this.collection = new Records(null, {
                        url: '/api/0/forms/' + id + '/data/'
                    });
                    this.fields.fetch({
                        success: function () {
                            that.collection.fetch({ reset: true });
                        }
                    });
                } else {
                    alert("Type not accounted for.");
                    return;
                }
                this.listenTo(this.collection, 'reset', this.renderSpreadsheet);
                this.collection.query = this.getDefaultQueryString();
                this.collection.fetch({ reset: true });
            },
            getDefaultQueryString: function () {
                return "WHERE project = " + this.app.selectedProject.id;
            },
            renderSpreadsheet: function () {
                console.log("Rendering Spreadsheet");
                if (this.collection.length == 0) {
                    this.$el.find('#grid').html("no rows found");
                    return;
                }
                var grid = this.$el.find('#grid').get(0),
                    rowHeights = [],
                    i = 0,
                    data = [],
                    that = this;
                if (this.table) {
                    this.table.destroy();
                    this.table = null;
                }
                for (i = 0; i < this.collection.length; i++) {
                    rowHeights.push(55);
                }
                this.collection.each(function (model) {
                    var rec = model.toJSON();
                    if (rec.tags) {
                        rec.tags = rec.tags.join(", ");
                    }
                    data.push(rec);
                });
                this.table = new Handsontable(grid, {
                    data: data,
                    colWidths: this.getColumnWidths(),
                    rowHeights: rowHeights,
                    colHeaders: this.getColumnHeaders(),
                    manualColumnResize: true,
                    manualRowResize: true,
                    rowHeaders: true,
                    columns: this.getColumns(),
                    maxRows: this.collection.length,
                    autoRowSize: true,
                    columnSorting: true,
                    undo: true,
                    afterChange: function (changes, source) {
                        that.saveChanges(changes, source);
                    }
                });
            },
            saveChanges: function (changes, source) {
                //sync with collection:
                var i, idx, key, oldVal, newVal, model;
                if (_.contains(["edit", "autofill", "undo", "redo", "paste"], source)) {
                    for (i = 0; i < changes.length; i++) {
                        idx = changes[i][0];
                        key = changes[i][1];
                        oldVal = changes[i][2];
                        newVal = changes[i][3];
                        if (oldVal !== newVal) {
                            console.log("[" + source + "]: saving changes to database...");
                            //Note: relies on the fact that the first column is the ID column
                            //      see the getColumns() function below
                            model = this.getModelFromCell(idx);
                            model.set(key, newVal);
                            model.save(model.changedAttributes(), {patch: true, wait: true});
                        } else {
                            console.log("[" + source + "], but no value change. Ignored.");
                        }
                    }
                }
            },
            getModelFromCell: function (index) {
                var modelID = this.table.getDataAtRowProp(index, "id");
                return this.collection.get(modelID);
            },
            thumbnailRenderer: function (instance, td, rowIndex, colIndex, prop, value, cellProperties) {
                var that = this,
                    img = document.createElement('IMG'),
                    model,
                    modalImg,
                    captionText,
                    modal,
                    span;
                img.src = value;
                img.onclick = function () {
                    model = that.getModelFromCell(rowIndex);
                    console.log(model);
                    // alert("TODO: Turn this image link into a preview: " + model.get("path_large"));
                    // Get the modal
                    modal = document.getElementById('myModal');

                    // Get the image and insert it inside the modal - use its "alt" text as a caption
                    //var img = document.getElementById('myImg');
                    modalImg = document.getElementById("img01");
                    captionText = document.getElementById("caption");
                    modal.style.display = "block";
                    modalImg.src = model.get("path_medium");

                    // Get the <span> element that closes the modal
                    span = document.getElementsByClassName("close")[0];

                    // When the user clicks on <span> (x), close the modal
                    span.onclick = function () {
                        modal.style.display = "none";
                    };
                };
                Handsontable.Dom.empty(td);
                td.appendChild(img);
                return td;
            },
            audioRenderer: function (instance, td, rowIndex, colIndex, prop, value, cellProperties) {
                td.innerHTML = "<audio controls>" +
                    "<source src='" + value + "'></source>" +
                    "</audio>";
                return td;
            },

            markerRenderer: function(instance, td, rowIndex, colIndex, prop, value, cellProperties){
                console.log("Marker Being Worked on");
            },

            buttonRenderer: function (instance, td, row, col, prop, value, cellProperties) {
                var button = document.createElement('BUTTON'),
                    that = this,
                    model;
                button.innerHTML = "<i class='fa fa-trash trash_button' aria-hidden='true'></i>";
                Handsontable.Dom.empty(td);
                td.appendChild(button);
                button.onclick = function () {
                    if (!confirm("Are you sure you want to delete this row?")) {
                        return;
                    }
                    // First grab the model of the target row to delete
                    model = that.getModelFromCell(row);

                    // The model holding the row data is destroyed,
                    // but the row containing the data still appears
                    // inside the data from handsontable (H.O.T.)
                    model.destroy();

                    // We need to call instance, since it calls the data table
                    // from H.O.T. to easily alter the table
                    // by removing the target row
                    instance.alter("remove_row", row);

                    // Now there is no trace of any deleted data,
                    // especially when the user refreshes the page
                };
                return td;
            },

            getColumnHeaders: function () {
                var cols;
                switch (this.collection.key) {
                    case "audio":
                        return ["ID", "Title", "Caption", "Audio", "Tags", "Attribution", "Owner", "Delete"];
                    case "photos":
                        return ["ID", "Title", "Caption", "Thumbnail", "Tags", "Attribution", "Owner", "Delete"];
                    case "markers":
                        return ["ID", "Title", "Caption", "Tags", "Lat", "Lng", "Owner", "Delete"];
                    default:
                        cols = ["ID"];
                        for (var i = 0; i < this.fields.length; ++i) {
                            cols.push(this.fields.at(i).get("col_name") + " " + "<a class='fa fa-minus-circle delete_column' fieldIndex= '"+ i +"' aria-hidden='true'></a>");
                        }
                        cols.push("Delete");
                        cols.push("<a class='fa fa-plus-circle' id='addColumn' aria-hidden='true'></a>");
                        console.log(cols);
                        return cols;
                }
            },
            getColumnWidths: function () {
                switch(this.collection.key){
                    case "audio":
                        return [30, 200, 400, 300, 200, 100, 80, 100];
                    case "photos":
                        return [30, 200, 400, 65, 200, 100, 80, 100];
                    case "markers":
                        return [30, 200, 400, 200, 80, 80, 80, 100];
                    default:
                        var cols = [30];
                        for (var i = 0; i < this.fields.length; ++i){
                            cols.push(150);
                        }
                        console.log(cols);
                        return cols;
                }
            },

            doSearch: function (query) {
                query = "WHERE " + query + " AND project = " + this.app.selectedProject.id;
                this.collection.query = query;
                this.collection.fetch({ reset: true });
            },

            clearSearch: function () {
                this.collection.query = this.getDefaultQueryString();
                this.collection.fetch({ reset: true });
            },
            getColumns: function () {
                switch (this.collection.key) {
                    case "audio":
                        return [
                            { data: "id", readOnly: true},
                            { data: "name", renderer: "html"},
                            { data: "caption", renderer: "html"},
                            { data: "file_path", renderer: this.audioRenderer, readOnly: true},
                            { data: "tags", renderer: "html" },
                            { data: "attribution", renderer: "html"},
                            { data: "owner", readOnly: true},
                            { data: "button", renderer: this.buttonRenderer.bind(this), readOnly: true}
                        ];
                    case "photos":
                       return [
                            { data: "id", readOnly: true},
                            { data: "name", renderer: "html"},
                            { data: "caption", renderer: "html"},
                            { data: "path_marker_lg", renderer: this.thumbnailRenderer.bind(this), readOnly: true},
                            { data: "tags", renderer: "html" },
                            { data: "attribution", renderer: "html"},
                            { data: "owner", readOnly: true},
                            { data: "button", renderer: this.buttonRenderer.bind(this), readOnly: true}
                       ];
                    case "markers":
                       return [
                            { data: "id", readOnly: true},
                            { data: "name", renderer: "html"},
                            { data: "caption", renderer: "html"},
                            { data: "tags", renderer: "html" },
                            { data: "lat", renderer: "html" },
                            { data: "lng", renderer: "html" },
                            { data: "owner", readOnly: true},
                            { data: "button", renderer: this.buttonRenderer.bind(this), readOnly: true}
                       ];
                    default:
                        var cols = [{
                            data: "id",
                            readOnly: true
                        }];
                        for (var i = 0; i < this.fields.length; ++i){
                            // Make sure to add in the "-" symbol after field name to delete column
                            var type = this.fields.at(i).get("data_type").toLowerCase();
                            switch (type) {
                                case "boolean":
                                    type = "checkbox";
                                    break;
                                case "integer":
                                    type = "numeric";
                                    break;
                                default:
                                    type = "text";
                            }
                            console.log(type);
                            cols.push({
                                data: this.fields.at(i).get("col_name"),
                                type: type
                            })
                        };
                        cols.push(
                        { data: "button", renderer: this.buttonRenderer.bind(this), readOnly: true});
                        // This will be add field header rough draft button
                        // for display pruposes without any function

                        // Replace this with a simple " + " to add last column
                        cols.push(
                            {data: "addField", renderer: "html", readOnly: true}
                        );
                        return cols;
                }
            },

            showCreateFieldForm: function () {
                // see the apps/gallery/views/toolbar-dataview.js function
                // to pass the appropriate arguments:
                var fieldView = new CreateFieldView({
                    formID: this.app.dataType.split("_")[1],
                    fields: this.fields,
                    app: this.app
                });
                this.app.vent.trigger('show-modal', {
                    title: "Create New Column",
                    view: fieldView,
                    saveFunction: fieldView.saveToDatabase,
                    width: 300,
                    height: 100
                });
            },

            deleteField: function (e) {
                //
                // You need to access the column that is being selected
                // Then re-order the columns so that the deleted column is last
                // Then after re-ordering the columns, then delete the selected column
                //
                var that = this;
                if (!confirm("Do you want to delete this field?")){
                    return;
                }

                e.preventDefault();
                var fieldIndex = $(e.currentTarget).attr("fieldIndex");
                console.log(fieldIndex + " - " + this.fields.at(fieldIndex).get("col_name"));
                var targetColumn = this.fields.at(fieldIndex);
                console.log(targetColumn);
                console.log(this.fields);
                targetColumn.destroy({
                    success: function () {
                        alert("successfully deleted!");
                        that.renderSpreadsheet();
                    }
                });

            },
            addRow: function () {
                //alert("add row here");
                //console.log(this.table.countRows());
                //console.log(this);

                var that = this;

                //var id = this.app.dataType.split("_")[1];
                var projectID = this.collection.models[0].get("project_id");

                var rec;

                if (this.app.dataType == "markers"){
                    rec = new Marker({project_id: projectID});
                } else {
                    rec = new Record ({project_id: projectID});
                }
                rec.collection = this.collection;
                rec.save(null, {
                    success: function(){
                        that.collection.add(rec);
                        that.renderSpreadsheet();
                    }
                });

                // GOtta do something about the order of ID on table

                // Trying to add a row to the handsonTable at the end index,
                // but I have no luck yet with that alone
                //this.table.alter("insert_row", null);

            }

        });
        return Spreadsheet;
    });



    /*
      TODO:

      Make the last added row reserved for "Add Row"
      and when the user does click on it, then a new ro pops up.

      For the existing rows, add the minus button next to the row header title
      so that the user can delete existing rows with warning
    */
