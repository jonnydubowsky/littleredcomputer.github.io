"use strict";
var StandardMap = (function () {
    function StandardMap(K) {
        this.twoPi = 2 * Math.PI;
        this.generate = function (theta, I, n) {
            for (var i = 0; i < n; ++i) {
                yield [theta, I];
                var nI = I + (this.K * Math.sin(theta));
                theta = this.PV(theta + nI);
                I = this.PV(nI);
            }
        };
        this.callback = function (theta, I, n, callback) {
            for (var i = 0; i < n; ++i) {
                callback(theta, I);
                var nI = I + (this.K * Math.sin(theta));
                theta = this.PV(theta + nI);
                I = this.PV(nI);
            }
        };
        this.K = K;
        this.PV = this.principal_value(this.twoPi);
        console.log('SM constructor');
    }
    StandardMap.prototype.principal_value = function (cuthigh) {
        var cutlow = cuthigh - this.twoPi;
        return function (x) {
            if (cutlow <= x && x < cuthigh) {
                return x;
            }
            var y = x - this.twoPi * Math.floor(x / this.twoPi);
            return y < cuthigh ? y : y - this.twoPi;
        };
    };
    StandardMap.prototype.run = function (theta, I, point, fail) {
        var nI = I + (this.K * Math.sin(theta));
        point(this.PV(theta + nI), this.PV(nI));
    };
    return StandardMap;
}());
exports.StandardMap = StandardMap;
var ExploreMap = (function () {
    function ExploreMap(canvas, M) {
        var _this = this;
        this.canvas = document.getElementById(canvas);
        this.M = M;
        this.context = this.canvas.getContext('2d');
        var _a = [2 * Math.PI, 2 * Math.PI], w = _a[0], h = _a[1];
        this.canvas.onmousedown = function (e) {
            console.log(e);
            var _a = [e.offsetX / _this.context.canvas.width * w,
                h - e.offsetY / _this.context.canvas.height * h], cx = _a[0], cy = _a[1];
            _this.Explore(cx, cy);
        };
        this.context.fillStyle = 'red';
        this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h);
        this.context.translate(0, -h);
        this.context.fillStyle = 'green';
        this.context.fillRect(Math.PI, Math.PI, 0.05, 0.1);
    }
    ExploreMap.prototype.pt = function (x, y) {
        this.context.fillStyle = 'rgba(0,0,255,0.3)';
        this.context.beginPath();
        this.context.arc(x, y, 0.01, 0, 2 * Math.PI);
        this.context.fill();
        this.context.closePath();
    };
    ExploreMap.prototype.Explore0 = function (x, y) {
        var _this = this;
        for (var i = 0; i < 1000; ++i) {
            this.M.run(x, y, function (xp, yp) {
                _this.pt(xp, yp);
                x = xp;
                y = yp;
            }, function () {
                console.log('FAIL');
            });
        }
    };
    ExploreMap.prototype.Explore1 = function (x, y) {
        for (var _i = 0, _a = this.M.generate(x, y, 1000); _i < _a.length; _i++) {
            _b = _a[_i], x = _b[0], y = _b[1];
            this.pt(x, y);
        }
        var _b;
    };
    ExploreMap.prototype.Explore = function (x, y) {
        this.M.callback(x, y, 1000, this.pt.bind(this));
    };
    return ExploreMap;
}());
exports.ExploreMap = ExploreMap;
