define(["marionette",
        "underscore",
        "jquery",
        "views/maps/sidepanel/filter",
        "text!" + templateDir + "/sidepanel/layerPanelHeader.html",
        "views/maps/sidepanel/menus/layersMenu",
        "views/maps/sidepanel/layerList",
        "views/maps/sidepanel/layerEditor"
    ],
    function (Marionette, _, $, DataFilter, LayerPanelHeader, LayersMenu, LayerList, LayerEditor) {
        'use strict';
        /**
         * A class that handles display and rendering of the
         * data panel and projects menu
         * @class LayerPanel
         */
        var LayerPanel = Marionette.LayoutView.extend({
            /**
             * @lends localground.maps.views.DataPanel#
             */
            app: null,
            opts: null,

            template: function () {
                return _.template(LayerPanelHeader);
            },

            regions: {
                layerListRegion: "#layer-manager",
                dataFilterRegion: "#data-filter",
                layersMenuRegion: "#layers-menu"
            },

            events: {
                'click #add-layer': 'showLayerEditor'
            },

            initialize: function (opts) {
                this.app = opts.app;
                this.opts = opts;
                this.app.vent.on("adjust-layout", this.resize.bind(this));
                this.app.vent.on("show-layer-list", this.showLayerList.bind(this));
                this.app.vent.on("show-layer-editor", this.showLayerEditor.bind(this));
            },

            showLayerEditor: function (data) {
                var opts = _.clone(this.opts);
                if (!_.isUndefined(data.model)) {
                    _.extend(opts, {model: data.model});
                }
                this.layerListRegion.show(new LayerEditor(opts));
            },

            showLayerList: function () {
                this.layerListRegion.show(new LayerList(this.opts));
            },

            onShow: function () {
                this.layerListRegion.show(new LayerList(this.opts));
                this.dataFilterRegion.show(new DataFilter(this.opts));
                this.layersMenuRegion.show(new LayersMenu(this.opts));
                this.resize();
            },

            destroy: function () {
                this.remove();
            },

            resize: function () {
                this.$el.find('.pane-body').height($('body').height() - 140);
            }
        });
        return LayerPanel;
    });