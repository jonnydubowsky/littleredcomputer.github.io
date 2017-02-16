"use strict";
var d3_scale_1 = require("d3-scale");
var d3_selection_1 = require("d3-selection");
var d3_axis_1 = require("d3-axis");
var d3_shape_1 = require("d3-shape");
var Graph = (function () {
    function Graph(element, width, height) {
        var _this = this;
        this.wrap_pi = false;
        this.points = false;
        this.margin = { left: 30, right: 10, top: 5, bottom: 30 };
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;
        this.x = d3_scale_1.scaleLinear().range([0, this.width]);
        this.y = d3_scale_1.scaleLinear().range([this.height, 0]);
        this.xAxis = d3_axis_1.axisBottom(this.x);
        this.yAxis = d3_axis_1.axisLeft(this.y);
        this.svg = d3_selection_1.select(element).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
        this.line = d3_shape_1.line()
            .x(function (d) { return _this.x(d[0]); })
            .y(function (d) { return _this.y(_this.wrap_pi ? Graph.wrap_pi(d[1]) : d[1]); });
    }
    Graph.wrap_pi = function (a0) {
        var PI = Math.PI;
        var a = a0;
        if (-PI > a || a >= PI) {
            a = a - 2 * PI * Math.floor(a / 2 / PI);
            a = a < PI ? a : a - 2 * PI;
        }
        return a;
    };
    Graph.prototype.axes = function (xDomain, yDomain) {
        this.x.domain(xDomain);
        this.y.domain(yDomain);
        this.drawAxes();
    };
    Graph.prototype.drawAxes = function () {
        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(this.xAxis);
        this.svg.append('g')
            .attr('class', 'y axis')
            .call(this.yAxis);
    };
    Graph.prototype.draw = function (data, cls) {
        var _this = this;
        cls = cls || 'default';
        var xf = this.wrap_pi ? Graph.wrap_pi : function (x) { return x; };
        if (this.points) {
            this.svg.selectAll('circle.graph-point.' + cls).remove();
            this.svg.selectAll('circle.graph-point.' + cls)
                .data(data)
                .enter()
                .append('circle')
                .attr('cx', function (d) { return _this.x(d[0]); })
                .attr('cy', function (d) { return _this.y(xf(d[1])); })
                .attr('r', 1)
                .classed(cls + ' graph-point', true)
                .attr('class', 'graph-point ' + cls);
        }
        else {
            this.svg.selectAll('path.' + cls).remove();
            this.svg.append('path').attr('class', cls)
                .datum(data)
                .classed(cls + ' line', true)
                .attr('d', this.line);
        }
    };
    return Graph;
}());
exports.Graph = Graph;
