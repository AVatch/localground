define(["marionette",
        "handlebars",
        'color-picker-eyecon',
        "models/map",
        "text!../../templates/left/panel-styles.html"
    ],
    function (Marionette, Handlebars, colorPicker, Map, PanelStylesTemplate) {
        'use strict';

        var SelectSkinView = Marionette.ItemView.extend({
            activeKey: "title",

            template: Handlebars.compile(PanelStylesTemplate),
            
            events: {
                'change #text-type': 'updateType',
                'change #font': 'updateFont',
                'change #fw': 'updateFontWeight',
                'change #color-picker': 'updateFontColor',
                'change #font-size': 'updateFontSize'
            },

            initialize: function (opts) {
                this.app = opts.app;
                this.model = new Map(
                    { id: 1, name: "Flowers & Birds", project_id: 4 }
                    );
                console.log(this.model);
                this.listenTo(this.app.vent, 'change-map', this.setModel);

                // here is some fake data until the
                // /api/0/maps/ API Endpoint gets built:
                //  this.collection = Maps;
                console.log("panel styles initialized");
                
            },
            
            onRender: function () {
                var that = this;
                console.log("it's color");
                this.$el.find('#color-picker').ColorPicker({
            
                    onShow: function (colpkr) {
                        $(colpkr).fadeIn(500);
                        return false;
                    },
                    onHide: function (colpkr) {
                        $(colpkr).fadeOut(500);
                        return false;
                    },
                    onChange: function (hsb, hex, rgb) {
                        that.model.get("panel_styles")[that.activeKey].color = hex;
                        $('#color-picker').css('color', '#' + hex);
                    }
                });
            },
            

            
            templateHelpers: function () {
                return {
                    json: JSON.stringify(this.model.toJSON(), null, 2),
                    currentType: this.model.get("panel_styles")[this.activeKey],
                    activeKey: this.activeKey,
                    font: this.model.get("panel_styles")[this.activeKey].font,
                    fontWeight: this.model.get("panel_styles")[this.activeKey].fw
                    };
            },
            setModel: function (model) {
                this.model = model;
                this.render();
                console.log(this.model);
            },
            updateType: function () {
                this.activeKey = this.$el.find("#text-type").val();
                this.render();
            },
            updateFont: function () {
                this.model.get("panel_styles")[this.activeKey].font = this.$el.find("#font").val();
                this.render();
            },
            updateFontWeight: function () {
                this.model.get("panel_styles")[this.activeKey].fw = this.$el.find("#fw").val();
                this.render();
            },
            updateFontColor: function () {
                this.model.get("panel_styles")[this.activeKey].color = this.$el.find("#color-picker").css("color");
                console.log(this.$el.find("#color-picker").css("color"));
                this.render();
            },
            updateFontSize: function () {
                this.model.get("panel_styles")[this.activeKey].size = this.$el.find("#font-size").val();
                this.render();
            },


        });
        return SelectSkinView;
    });

//This view needs to update the map.js model