require(['boot'], function () {
    'use strict';
    var specs = [
        // LIB
        'spec/sql-parser-test.js',
        'spec/truth-statement-test.js',
        'spec/data-manager-test.js',

        // MODELS
        'spec/models/layer-test.js',

        // COLLECTIONS
        'spec/collections/base-test.js',
        'spec/collections/layers-test.js',

        // VIEWS
        'spec/views/layer-manager-test.js',
        'spec/views/layer-list-test.js',
        'spec/views/layer-test.js',
        'spec/views/layer-item-test.js'
    ];
    require(specs, function () {
        window.onload();
    });
});