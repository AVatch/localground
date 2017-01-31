define([
    "underscore",
    "lib/maps/overlays/infobubbles/marker",
    "lib/maps/overlays/base"
], function (_, MarkerBubble, Base) {
    "use strict";
    /**
     * Class that controls marker point model overlays.
     * Extends @link {localground.maps.overlays.Overlay}.
     * @class Marker
     */
    var Marker = Base.extend({

        /**
         * Get the corresponding SVG marker icon
         * @returns {Object} icon definition
         */
        getIcon: function () {
            var opts = this.getIconPaths('circle');
            return {
                path: opts.path,
                scale: opts.scale,
                fillColor: '#ed867d', //this.model.get("color")
                fillOpacity: 1,
                strokeColor: '#ed867d',
                strokeWeight: 2
            };
        },

        /** adds icon to overlay. */
        initialize: function () {
            Base.prototype.initialize.apply(this, arguments);
            this.redraw();
        },

        /** shows the google.maps overlay on the map. */
        show: function () {
            Base.prototype.show.apply(this);
            this.redraw();
            //this.highlight();
        },

        initInfoBubble: function (opts) {
            this.infoBubble = new MarkerBubble(_.extend({overlay: this}, opts));
        },

        redraw: function () {
            if (this.getShapeType() === "Point") {
                this._overlay.setIcon(this.getIcon());
            } else {
                this._overlay.redraw();
            }
        }

    });
    return Marker;
});