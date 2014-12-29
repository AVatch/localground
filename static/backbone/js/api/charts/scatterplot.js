define(["underscore",
        "charts/chart",
        "highcharts"
    ],
    function (_, Chart) {
        "use strict";
        /**
         * The BarChart's job is to render a bar chart.
         */
        var ScatterPlot = Chart.extend({
            initialMessage: 'Please drag at least one numeric variable onto the y-axis ' +
                            'and exactly one numeric variable onto the x-axis',
            xAxis: null,
            yAxis: null,
            yMin: 0,
            initialize: function (opts) {
                Chart.prototype.initialize.apply(this, arguments);
                this.xAxis = opts.xAxis;
                this.yAxis = opts.yAxis;
            },
            render: function () {
                if (this.yAxis.collection && this.yAxis.collection.length >= 1 &&
                        this.xAxis.collection.length == 1) {
                    this.renderChart();
                } else {
                    this.destroyChart();
                    this.showInitialMessage();
                }
            },
            transformData: function () {
                var collection = this.dataManager.getRecords(),
                    that = this,
                    i = 0,
                    x_attribute = this.xAxis.collection.at(0).get("col_name"),
                    x = null,
                    y = null;
                this.seriesData = [];
                this.yMin = 1000000;
                this.yAxis.collection.each(function (field) {
                    that.seriesData.push({
                        name: field.get("col_alias"),
                        data: []
                    });
                });
                collection.each(function (record) {
                    i = 0;
                    that.yAxis.collection.each(function (field) {
                        x = record.get(x_attribute);
                        y = record.get(field.get("col_name"));
                        that.seriesData[i].data.push([x, y]);

                        // track the minimum y-value for the chart 
                        // configuration object:
                        that.yMin = Math.min(y, that.yMin);
                        ++i;
                    });
                });
            },
            renderChart: function () {
                this.$el.css("height", "auto");
                this.setSize();
                this.transformData();
                var chartOpts = {
                    chart: {
                        type: 'scatter',
                        height: this.chartHeight,
                        zoomType: 'xy'
                    },
                    title: {
                        text: 'My Chart Title'
                    },
                    xAxis: {
                        title: {
                            enabled: true,
                            text: 'X-Axis Label'
                        },
                        startOnTick: true,
                        endOnTick: true,
                        showLastLabel: true
                    },
                    yAxis: {
                        title: {
                            text: 'Y-Axis Label'
                        },
                        min: this.yMin
                    },
                    legend: {
                        layout: 'vertical',
                        align: 'left',
                        verticalAlign: 'top',
                        x: 100,
                        y: 70,
                        floating: true,
                        borderWidth: 1
                    },
                    plotOptions: {
                        scatter: {
                            marker: {
                                radius: 5,
                                states: {
                                    hover: {
                                        enabled: true,
                                        lineColor: 'rgb(100,100,100)'
                                    }
                                }
                            },
                            tooltip: {
                                headerFormat: '<b>{series.name}</b><br>',
                                pointFormat: '{point.x}, {point.y}'
                            }
                        }
                    }
                };
                _.extend(chartOpts, { series: this.seriesData });
                this.$el.highcharts(chartOpts);
            }
        });
        return ScatterPlot;
    });