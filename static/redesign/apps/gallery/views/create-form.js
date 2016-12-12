define([
    "jquery",
    "underscore",
    "handlebars",
    "marionette",
    "text!../templates/create-form.html",
    "text!../templates/field-item.html",
    "models/form",
    "collections/fields"
], function ($, _, Handlebars, Marionette, CreateFormTemplate, FieldItemTemplate, Form, Fields) {
    // Setting up a create form js
    'use strict';
    var CreateFormView = Marionette.CompositeView.extend({

        initialize: function (opts) {
            _.extend(this, opts);

            /* to check if editing works
            // for now we test the one id based on project id
            this.model = new Form({ id: 14 });
            this.listenTo(this.model, 'reset', this.test);
            var that = this;
            this.model.fetch({
                success: function () {
                    that.render();
                }
            });
            */ //end check if editing works

            if (this.model == undefined) {
                // Create a blank project if new project made
                console.log("creating new form...");
                this.model = new Form();
            } else {
                console.log("initializing form...");
                this.initModel();
            }
            //this.listenTo(this.model, 'sync', this.createNewFields);
            this.template = Handlebars.compile(CreateFormTemplate);
            this.render();
        },
        initModel: function () {
            this.collection = this.model.fields;
            this.attachCollectionEventHandlers();
            Marionette.CompositeView.prototype.initialize.call(this);
            this.model.getFields();
        },
        attachCollectionEventHandlers: function () {
            //this.listenTo(this.collection, 'add', this.render);
            //this.listenTo(this.collection, 'destroy', this.render);
            this.listenTo(this.collection, 'reset', this.render);
        },

        childViewContainer: "#fieldList",
        childViewOptions: function () {
            return this.model.toJSON();
        },
        getChildView: function () {
            // this child view is responsible for displaying
            // and deleting Field models:
            return Marionette.ItemView.extend({
                initialize: function (opts) {
                    _.extend(this, opts);
                },
                events: {
                    'click .delete-field': 'doDelete'
                },
                template: Handlebars.compile(FieldItemTemplate),
                tagName: "tr",
                doDelete: function (e) {
                    if (!confirm("Are you sure you want to remove this field from the form?")) {
                        return;
                    }
                    this.model.destroy();
                    e.preventDefault();
                },
                onRender: function () {
                    console.log(this.model.toJSON());
                }
            });
        },
        template: Handlebars.compile(CreateFormTemplate),
        events: {
            'click #save-form-settings' : 'saveFormSettings',
            'click .close': 'hideModal',
            'click .new_field_button' : 'addFieldButton'
        },
        fetchShareData: function () {
            this.model.getFields();
        },
        /*hideModal: function () {
            this.$el.hide();
        },
        
        Behavior problem: After opeiing the modal window and closing
        for the first time, modal windows opo up when
        clicking on the add button again.
        
        onRender: function () {
            //console.log("rerender");
            var modal = this.$el.find('.modal').get(0),
                span = this.$el.find('.close').get(0);
            modal.style.display = "block";
            // When the user clicks on <span> (x), close the modal
            span.onclick = function () {
                modal.style.display = "none";
            };

            // When the user clicks anywhere outside of the modal, close it
            window.onclick = function (event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            };
        },*/

        // Need to add more functions to handle various events
        // and to get the form to open up
        saveFormSettings: function () {
            alert("save!");
            var formName = this.$el.find('#formName').val(),
                //shareType = $('#share_type').val(),
                //tags = $('#tags').val(),
                caption = this.$el.find('#caption').val(),
                that = this;

            this.model.set('name', formName);
            //this.model.set('access_authority', shareType);
            //this.model.set('tags', tags);
            this.model.set('caption', caption);
            this.model.set('slug', 'slug_' + parseInt(Math.random() * 100000, 10));
            this.model.set('project_ids', [this.app.selectedProject.id]);
            this.model.save(null, {
                success: function () {
                    alert("saved");
                    that.createNewFields();
                }
            });
        },

        //
        // Still needs refactoring since the majority of the code
        // is based on the share-form.js file
        //

        createNewFields: function () {
            console.log("createNewFields Called");
            // Gather the list of fields changed / added
            var $fieldList = this.$el.find("#fieldList"),
                $fields = $fieldList.children(),
                i,
                id,
                $row,
                fieldName,
                fieldType,
                existingField;

            if (!this.model.fields) {
                console.log("fields not defined");
                this.model.fields = new Fields(null,
                        { id: this.model.get("id") }
                    );
                this.collection = this.model.fields;
                this.attachCollectionEventHandlers();
            }

            //loop through each table row:
            for (i = 0; i < $fields.length; i++) {
                $row = $($fields[i]);
                fieldName = $row.find(".fieldname").val();
                if ($row.attr("id") == this.model.id) {
                    //edit existing fields:
                    console.log("Updating existing field");
                    id = $row.find(".id").val();
                    existingField = this.model.getFieldByID(id);
                    existingField.set("col_alias", fieldName);
                    existingField.save();
                } else {
                    //create new fields:
                    console.log("Create new Field");
                    fieldType = $row.find(".fieldType").val();
                    this.model.createField(fieldName, fieldType);
                }
            }
        },

        addFieldButton: function () {
            console.log("Pressed new Field Link");
            var fieldTableDisplay = $(".fieldTable"),
                $newTR = $("<tr class='new-row'></tr>"),
                template = Handlebars.compile(FieldItemTemplate);
            fieldTableDisplay.show();// Make this visible even with 0 users
            $newTR.append(template());
            this.$el.find("#fieldList").append($newTR);
            // Now find out how many rows are there
            // to either show user table or add user prompt
            //
            // this.checkNumberOfRows();

        }
    });
    return CreateFormView;

});
