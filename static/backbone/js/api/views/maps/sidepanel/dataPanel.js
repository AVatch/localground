define(["marionette",
        "underscore",
        "jquery",
        "text!" + templateDir + "/sidepanel/dataPanelHeader.html",
        "views/maps/sidepanel/menus/projectsMenu",
        "views/maps/sidepanel/projectTags",
        "views/maps/sidepanel/itemListManager",
        "views/maps/sidepanel/shareModal/shareModal"
    ],
    function (Marionette,
              _,
              $,
              dataPanelHeader,
              ProjectsMenu,
              ProjectTags,
              ItemListManager,
              ShareModal) {
        'use strict';
        /**
         * A class that handles display and rendering of the
         * data panel and projects menu
         * @class DataPanel
         */
        var DataPanel = Marionette.LayoutView.extend({
            /**
             * @lends localground.maps.views.DataPanel#
             */
            template: function () {
                return _.template(dataPanelHeader);
            },

            events: {
                'click #mode_toggle': 'toggleEditMode',
                'click #share-data': 'showShareModal'
            },
            regions: {
                projectMenu: "#projects-menu",
                projectTags: "#project-tags",
                itemList: "#item-list-manager",
                shareModalWrapper: "#share-modal-wrapper"
            },
            /**
             * Initializes the dataPanel
             * @param {Object} opts
             */
            initialize: function (opts) {
                this.app = opts.app;
                this.opts = opts;
                opts.app.vent.on("adjust-layout", this.resize.bind(this));
            },

            onShow: function () {
                this.projectMenu.show(new ProjectsMenu(this.opts));
                this.projectTags.show(new ProjectTags(this.opts));
                this.itemList.show(new ItemListManager(this.opts));
                this.shareModalWrapper.show(new ShareModal(this.opts));
                this.listenTo(this.shareModalWrapper.currentView, 'load-view', this.loadView);
            },

            toggleEditMode: function () {
                if (this.app.getMode() === "view") {
                    this.app.setMode("edit");
                    this.$el.find('#mode_toggle').addClass('btn-info');
                } else {
                    this.app.setMode("view");
                    this.$el.find('#mode_toggle').removeClass('btn-info');
                }
                this.app.trigger('mode-change');

            },

            destroy: function () {
                this.remove();
            },

            resize: function () {
                this.$el.find('.pane-body').height($('body').height() - 140);
            },

            showShareModal: function () {
                this.shareModalWrapper.currentView.setSerializedEntities(this.serializeActiveEntities());
                this.shareModalWrapper.$el.modal();
            },

            //A convenience method to gather all currently active map markers for saving in a view
            serializeActiveEntities: function () {
                var entities = [];
                _.each(this.itemList.currentView.collections, function (collection) {
                    var entityIds = collection.where({'showingOnMap': true}).map(function (model) {return model.id; });
                    if (entityIds.length > 0) {
                        entities.push({
                            overlay_type: collection.first().attributes.overlay_type,
                            ids: entityIds
                        });
                    }
                });
                return JSON.stringify(entities);
            },

            loadView: function (view) {
                var v = view.toJSON(),
                    //Take all unique project ids from the view
                    projectIds = _.chain(v.children)
                        .map(function (collection) {
                            return _.pluck(collection.data, 'project_id');
                        }).flatten().uniq().value();

                //dispatch call to projectMenu to load appropriate projects
                this.projectMenu.currentView.loadProjects(projectIds);
                //dispatch call to itemManager to only show appropriate items
                this.itemList.currentView.loadView(v);
                //set center to view's center
                this.app.vent.trigger('change-center', v.center);
                //set map type to the view's map type
                this.app.vent.trigger('set-map-type', v.basemap);
            }
        });
        return DataPanel;
    });
