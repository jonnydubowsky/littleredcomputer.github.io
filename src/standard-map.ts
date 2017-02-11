/**
  * Created by colin on 6/14/16.
  * http://littleredcomputer.github.io
  */

import {Solver, Derivative} from 'odex/src/odex'

interface HamiltonMap {
  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void): void
}

interface DifferentialEquation {
  evolve(initialData: number[], t1: number, dt: number, callback: (t: number, y: number[]) => void): void
}

const twoPi = Math.PI * 2

export class StandardMap implements HamiltonMap {
  K: number
  PV: (x: number) => number
  static twoPi = 2 * Math.PI

  constructor(K: number) {
    this.K = K
    this.PV = StandardMap.principal_value(twoPi)
  }

  static principal_value(cutHigh: number): (v: number) => number {
    const cutLow = cutHigh - twoPi
    return function (x: number) {
      if (cutLow <= x && x < cutHigh) {
        return x
      }
      const y = x - twoPi * Math.floor(x / twoPi)
      return y < cutHigh ? y : y - twoPi
    }
  }

  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void) {
    let [theta, I] = initialData
    for (let i = 0; i < n; ++i) {
      callback(theta, I)
      let nI = I + (this.K * Math.sin(theta))
      theta = this.PV(theta + nI)
      I = this.PV(nI)
    }
  }
}

export class DrivenPendulumMap implements HamiltonMap, DifferentialEquation {

  paramfn: () => {a: number, omega: number}
  S: Solver
  PV: (x: number) => number

  HamiltonSysder(m: number, l: number, omega: number, a: number, g: number): Derivative {
    return (x, [t, theta, p_theta]) => {
      // let _1 = Math.sin(omega * t)
      let _2 = Math.pow(l, 2)
      let _3 = omega * t
      let _4 = Math.sin(theta)
      let _5 = Math.cos(theta)
      return [1,
        (Math.sin(_3) * _4 * a * l * m * omega + p_theta) / (_2 * m),
        (- Math.pow(Math.sin(_3), 2) * _5 * _4 * Math.pow(a, 2) * l * m * Math.pow(omega, 2) - Math.sin(_3) * _5 * a * omega * p_theta - _4 * g * _2 * m) / l]
    }
  }

  LagrangeSysder(l: number, omega: number, a: number, g: number): Derivative {
    return (x, [t, theta, thetadot]) => {
      let _1 = Math.sin(theta)
      return [1, thetadot, (_1 * Math.cos(omega * t) * a * Math.pow(omega, 2) - _1 * g) / l]
    }
  }

  constructor(paramfn: () => {a: number, omega: number}) {
    this.paramfn = paramfn
    this.S = new Solver(3)
    this.S.denseOutput = true
    this.S.absoluteTolerance = 1e-8
    this.PV = StandardMap.principal_value(Math.PI)
  }

  generateSection(initialData: number[], n: number, callback: (x: number, y: number) => void) {
    let params = this.paramfn()
    let period = 2 * Math.PI / params.omega
    let t1 = 1000 * period
    let H = this.HamiltonSysder(1, 1, params.omega, params.a, 9.8)
    this.S.solve(H, 0, [0].concat(initialData), t1, this.S.grid(period, (t, ys) => callback(this.PV(ys[1]), ys[2])))
  }

  evolve(initialData: number[], t1: number, dt: number, callback: (x: number, ys: number[]) => void) {
    let params = this.paramfn()
    console.log('params', params)
    let L = this.LagrangeSysder(1, params.omega, params.a, 9.8)
    let p0 = performance.now()
    this.S.solve(L, 0, [0].concat(initialData), t1, this.S.grid(dt, callback))
    console.log('evolution took', (performance.now() - p0).toFixed(2), 'msec')
  }
}

export class ExploreMap {
  canvas: HTMLCanvasElement
  M: HamiltonMap
  context: CanvasRenderingContext2D
  onExplore: (x: number, y: number) => void

  constructor(canvas: string, M: HamiltonMap, xRange: number[], yRange: number[]) {
    this.canvas = <HTMLCanvasElement> document.getElementById(canvas)
    this.M = M
    this.context = this.canvas.getContext('2d')
    let [w, h] = [xRange[1] - xRange[0], yRange[1] - yRange[0]]
    this.canvas.onmousedown = (e: MouseEvent) => {
      let [cx, cy] = [e.offsetX / this.context.canvas.width * w + xRange[0],
        yRange[1] - e.offsetY / this.context.canvas.height * h]
      let p0 = performance.now()
      this.Explore(cx, cy)
      console.log('exploration', (performance.now() - p0).toFixed(2), 'msec')
      this.onExplore && this.onExplore(cx, cy)
    }
    this.context.scale(this.context.canvas.width / w, -this.context.canvas.height / h)
    this.context.translate(-xRange[0], -yRange[1])
    this.context.fillStyle = 'rgba(23,64,170,0.5)'
  }
  i: number = 0

  // since pt is invoked in callback position, we want to define it as an instance arrow function
  pt = (x: number, y: number) => {
    // if (this.i % 100 === 0) console.log(this.i, 'pts')
    this.context.beginPath()
    this.context.arc(x, y, 0.01, 0, 2 * Math.PI)
    this.context.fill()
    this.context.closePath()
    ++this.i
  }

  Explore(x: number, y: number) {
    this.M.generateSection([x, y], 1000, this.pt)
  }
}

export class DrivenPendulumAnimation {
  amplitude = 0.1
  animLogicalSize = 1.3
  ctx: CanvasRenderingContext2D
  initialData: number[]
  data: number[][]
  frameIndex: number
  frameStart: number
  omega: number
  animating: boolean

  constructor(o: {
    omegaValueId: string
    omegaRangeId: string
    tValueId: string
    tRangeId: string
    animId: string
    exploreId: string
    theta0Id: string
    thetaDot0Id: string
    goButtonId: string
  }) {
    let omegaRange = <HTMLInputElement>document.getElementById(o.omegaRangeId)
    let tRange = <HTMLInputElement>document.getElementById(o.tRangeId)
    let diffEq = new DrivenPendulumMap(() => ({
      a: this.amplitude,
      omega: +omegaRange.value
    }))
    let anim = <HTMLCanvasElement>document.getElementById(o.animId)
    this.ctx = anim.getContext('2d')
    this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize))
    this.ctx.translate(this.animLogicalSize, -this.animLogicalSize)
    let xMap = new ExploreMap('p', diffEq, [-Math.PI, Math.PI], [-10, 10])
    xMap.onExplore = (theta0: number, thetaDot0: number) => {
      console.log('onExplore', theta0, thetaDot0)
      document.getElementById(o.theta0Id).textContent = theta0.toFixed(3)
      document.getElementById(o.thetaDot0Id).textContent = thetaDot0.toFixed(3)
      this.initialData = [theta0, thetaDot0]
    }
    let explore = <HTMLCanvasElement>document.getElementById(o.exploreId)
    omegaRange.addEventListener('change', (e: Event) => {
      explore.getContext('2d').clearRect(-Math.PI, -10, 2 * Math.PI, 20)
      let t = <HTMLInputElement>e.target
      document.getElementById(o.omegaValueId).textContent = (+t.value).toFixed(1)
    })
    tRange.addEventListener('change', (e: Event) => {
      let t = <HTMLInputElement>e.target
      document.getElementById(o.tValueId).textContent = t.value
    })
    document.getElementById(o.goButtonId).addEventListener('click', () => {
      // (re)solve the differential equation and update the data. Kick off the animation.
      let dt = 1 / 60
      let t1 = +tRange.value
      let n = Math.ceil(t1 / dt)
      this.data = new Array(n)
      let i = 0
      this.omega = +omegaRange.value
      let p0 = performance.now()
      diffEq.evolve(this.initialData, t1, dt, (x, ys) => {this.data[i++] = ys})
      console.log('DE evolution in', (performance.now() - p0).toFixed(1), 'msec')
      this.frameIndex = 0
      this.frameStart = performance.now()
      if (!this.animating) {
        this.animating = true
        requestAnimationFrame(this.frame)
      }
    })
  }
  frame = () => {
    let bob = (t: number) => this.amplitude * Math.cos(this.omega * t)
    this.ctx.clearRect(-this.animLogicalSize, -this.animLogicalSize, 2 * this.animLogicalSize, 2 * this.animLogicalSize)
    let d = this.data[this.frameIndex]
    let y0 = bob(d[0])
    let theta = d[1]
    const c = this.ctx
    c.lineWidth = 0.02
    c.beginPath()
    c.fillStyle = '#000'
    c.arc(0, y0, 0.05, 0, Math.PI * 2)
    c.fillStyle = '#f00'
    c.arc(Math.sin(theta), y0 - Math.cos(theta), 0.1, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#000'
    c.beginPath()
    c.moveTo(0, y0)
    c.lineTo(Math.sin(theta), y0 - Math.cos(theta))
    c.stroke()

    ++this.frameIndex
    if (this.frameIndex < this.data.length) {
      window.requestAnimationFrame(this.frame)
    } else {
      this.animating = false
      let et = (performance.now() - this.frameStart) / 1e3
      console.log('animation done', (this.data.length / et).toFixed(2), 'fps')
    }
  }
}

interface DoubleParams {
  l1: number
  m1: number
  l2: number
  m2: number
}

class DoublePendulumMap implements DifferentialEquation {
  paramfn: () => DoubleParams
  params: DoubleParams
  S: Solver

  LagrangeSysder(l1: number, m1: number, l2: number, m2: number): Derivative {
    const g = 9.8
    return (x, [t, theta, phi, thetadot, phidot]) => {
      // let _1 = Math.cos(- phi + theta)
      let _2 = Math.pow(phidot, 2)
      let _3 = Math.sin(phi)
      // let _4 = Math.sin(- phi + theta)
      let _5 = - phi
      // let _6 = Math.pow(Math.sin(- phi + theta), 2)
      let _7 = Math.sin(theta)
      let _8 = Math.pow(thetadot, 2)
      // let _9 = - phi + theta
      return [1,
        thetadot,
        phidot,
        (- Math.sin(_5 + theta) * Math.cos(_5 + theta) * l1 * m2 * _8 - Math.sin(_5 + theta) * l2 * m2 * _2 + Math.cos(_5 + theta) * _3 * g * m2 - _7 * g * m1 - _7 * g * m2) / (Math.pow(Math.sin(_5 + theta), 2) * l1 * m2 + l1 * m1),
        (Math.sin(_5 + theta) * Math.cos(_5 + theta) * l2 * m2 * _2 + Math.sin(_5 + theta) * l1 * m1 * _8 + Math.sin(_5 + theta) * l1 * m2 * _8 + _7 * Math.cos(_5 + theta) * g * m1 + _7 * Math.cos(_5 + theta) * g * m2 - _3 * g * m1 - _3 * g * m2) / (Math.pow(Math.sin(_5 + theta), 2) * l2 * m2 + l2 * m1)]
    }
  }

  constructor(paramfn: () => {l1: number, m1: number, l2: number, m2: number}) {
    this.paramfn = paramfn
    this.S = new Solver(5)
    this.S.denseOutput = true
    this.S.absoluteTolerance = 1e-8
  }

  evolve(initialData: number[], t1: number, dt: number, callback: (t: number, y: number[]) => void): void {
    let p = this.paramfn()
    console.log('params', this.params)
    let L = this.LagrangeSysder(p.l1, p.m1, p.l2, p.m2)
    this.params = p
    this.S.solve(L, 0, [0].concat(initialData), t1, this.S.grid(dt, callback))
  }
}

export class DoublePendulumAnimation {
  animLogicalSize = 1.3
  ctx: CanvasRenderingContext2D
  data: number[][]
  frameStart: number
  frameIndex: number
  animating: boolean
  params: DoubleParams
  valueUpdater(toId: string) {
    return (e: Event) => document.getElementById(toId).textContent = (<HTMLInputElement>e.target).value
  }

  constructor(o: {
    theta0RangeId: string,
    theta0ValueId: string,
    phi0RangeId: string,
    phi0ValueId: string,
    tRangeId: string,
    tValueId: string,
    animId: string,
    goButtonId: string
  }) {
    this.animating = false
    let deg2rad = (d: number) => d * 2 * Math.PI / 360
    let theta0Range = <HTMLInputElement>document.getElementById(o.theta0RangeId)
    theta0Range.addEventListener('change', this.valueUpdater(o.theta0ValueId))
    let phi0Range = <HTMLInputElement>document.getElementById(o.phi0RangeId)
    phi0Range.addEventListener('change', this.valueUpdater(o.phi0ValueId))
    let tRange = <HTMLInputElement>document.getElementById(o.tRangeId)
    tRange.addEventListener('change', this.valueUpdater(o.tValueId))
    let anim = <HTMLCanvasElement>document.getElementById(o.animId)
    this.ctx = anim.getContext('2d')
    this.ctx.scale(anim.width / (2 * this.animLogicalSize), -anim.height / (2 * this.animLogicalSize))
    this.ctx.translate(this.animLogicalSize, -this.animLogicalSize)
    let paramfn = () => ({l1: 0.5, m1: 0.5, l2: 0.5, m2: 0.5})
    let diffEq = new DoublePendulumMap(paramfn)
    document.getElementById(o.goButtonId).addEventListener('click', () =>  {
      let dt = 1 / 60
      let t1 = +tRange.value
      let n = Math.ceil(t1 / dt)
      this.data = new Array(n)
      let i = 0
      let p0 = performance.now()
      this.params = paramfn()
      diffEq.evolve([deg2rad(+theta0Range.value), deg2rad(+phi0Range.value), 0, 0], t1, dt, (x, ys) => {this.data[i++] = ys})
      console.log('evolution in', (performance.now() - p0).toFixed(2), 'msec')
      this.frameIndex = 0
      if (!this.animating) {
        this.animating = true
        requestAnimationFrame(this.frame)
      }
    })
  }
  frame = () => {
    this.ctx.clearRect(-this.animLogicalSize, -this.animLogicalSize, 2 * this.animLogicalSize, 2 * this.animLogicalSize)
    let d = this.data[this.frameIndex]
    console.log('frameIndex', this.frameIndex, 'd', this.data[this.frameIndex])
    let theta = d[1], phi = d[2]
    const c = this.ctx
    const p = this.params
    let x0 = 0, y0 = 0
    let x1 = p.l1 * Math.sin(theta), y1 = -p.l1 * Math.cos(theta)
    let x2 = x1 + p.l2 * Math.sin(phi), y2 = y1 - p.l2 * Math.cos(phi)
    c.lineWidth = 0.025
    c.strokeStyle = '#888'
    c.beginPath()
    c.moveTo(x0, y0)
    c.lineTo(x1, y1)
    c.lineTo(x2, y2)
    c.stroke()
    c.fillStyle = '#f00'
    c.beginPath()
    c.moveTo(x0, y0)
    c.arc(x0, y0, 0.05, 0, Math.PI * 2)
    c.moveTo(x1, y1)
    c.arc(x1, y1, 0.1, 0, Math.PI * 2)
    c.moveTo(x2, y2)
    c.arc(x2, y2, 0.1, 0, Math.PI * 2)
    c.fill()

    ++this.frameIndex
    if (this.frameIndex < this.data.length) {
      window.requestAnimationFrame(this.frame)
    } else {
      this.animating = false
      let et = (performance.now() - this.frameStart) / 1e3
      console.log('animation done', (this.data.length / et).toFixed(2), 'fps')
    }
  }
}
