---
layout: post
title:  "Standard Map (explorer)"
date:   2016-06-14 10:16:00
categories: math js
using: katex
---

<canvas id="s" width="400" height="400" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>
<canvas id="p" width="400" height="400" style="border-style: solid; border-color: #ccc; border-width: 4px"></canvas>

<script src="/public/js/standard-map.bundle.min.js"></script>
<script>
  var S = new s.StandardMap(0.6)
  var M = new s.ExploreMap('s', S, [0, 2*Math.PI], [0, 2*Math.PI])
  var P = new s.DrivenPendulumMap()
  var N = new s.ExploreMap('p', P, [-Math.PI, Math.PI], [-10, 10])
  //N.context.fillStyle = 'red'
  //N.context.fillRect(0,0,2,2);
</script>
