import {Solver, Derivative} from './node_modules/odex/src/odex'
import {Graph} from './graph'

class DifferentialEquationView {
  g: Graph[] = []
  solver: Solver

  constructor(dim: number, elements: string[], width: number, height: number) {
    elements.map(e => {
      this.solver = new Solver(dim)
      this.solver.denseOutput = true
      this.g.push(new Graph('#' + e, width, height))
      ; (<SVGElement> document.querySelector('#' + e + ' svg')).onmousemove = e => this.tweak(e)
    })
  }

  tweak = (e: MouseEvent) => console.log('tweak unimplemented')
}

export class Airy extends DifferentialEquationView {
  initialData: number[] = [0.2782174909, 0.2723742043]
  eq: Derivative = (x, y) => [y[1], x * y[0]]

  constructor(elt0: string, elt1: string) {
    super(2, [elt0, elt1], 500, 350)
    this.g[0].axes([-15, 5], [-0.5, 0.75])
    this.g[1].axes([-0.5, 0.5], [-1.5, 1.5])
  }

  draw(initialData: number[] = this.initialData) {
    let apts: [number, number][] = []
    let bpts: [number, number][] = []
    this.solver.solve(this.eq, -15, initialData, 5, this.solver.grid(0.05, (x: number, y: number[]) => {
      apts.push([x, y[0]])
      bpts.push([y[0], y[1]])
    }))
    this.g[0].draw(apts, 'Ai')
    this.g[1].draw(bpts)
  }

  tweak = (e: MouseEvent) => {
    let x = e.offsetX - 500
    let p = x / 2000
    let y = e.offsetY - 200
    let q = y / 2000
    this.draw([this.initialData[0] + p, this.initialData[1] + q])
  }
}

export class Lorenz extends DifferentialEquationView {
  initialData: number[] = [1, 1, 1]

  static L = (sigma: number, rho: number, beta: number) => (x: number, y: number[]) => [
    sigma * (y[1] - y[0]),
    y[0] * (rho - y[2]) - y[1],
    y[0] * y[1] - beta * y[2]
  ]

  eq: Derivative = Lorenz.L(10, 28, 8 / 3)

  constructor(elt: string) {
    super(3, [elt], 500, 500)
    this.g[0].axes([-30, 30], [0, 50])
  }

  tweak = (e: MouseEvent) => {
    let xt = (e.offsetX - 500) / 2000
    let yt = (e.offsetY - 500) / 2000
    this.draw([this.initialData[0] + xt, this.initialData[1] + yt])
  }

  draw(initialData: number[] = this.initialData) {
    let xpts: [number, number][] = []
    this.solver.solve(this.eq, 0, initialData, 20, this.solver.grid(0.005, (x, y) => {
      xpts.push([y[1], y[2]])
    }))
    this.g[0].draw(xpts, 'Lo')
  }
}

export class PredatorPrey extends DifferentialEquationView {
  static sz = 400
  initialData = [1, 1]

  static LV = (a: number, b: number, c: number, d: number) => (x: number, y: number[]) => [
    a * y[0] - b * y[0] * y[1],
    c * y[0] * y[1] - d * y[1]
  ]

  eq: Derivative = PredatorPrey.LV(2 / 3, 4 / 3, 1, 1)

  constructor(elt0: string, elt1: string) {
    super(2, [elt0, elt1], PredatorPrey.sz, PredatorPrey.sz)
    this.g[0].axes([0, 25],  [0, 4])
    this.g[1].axes([0, 3], [0, 2])
  }

  tweak = (e: MouseEvent) => {
    let x = e.offsetX
    let y = e.offsetY
    this.draw([3 * x / PredatorPrey.sz, 2 - 2 * y / PredatorPrey.sz])
  }

  draw(initialData: number[] = this.initialData) {
    let xpts: [number, number][] = []
    let ypts: [number, number][] = []
    let tpts: [number, number][] = []
    this.solver.solve(this.eq, 0, initialData, 25, this.solver.grid(0.01, (x, y) => {
      xpts.push([x, y[0]])
      ypts.push([x, y[1]])
      tpts.push([y[0], y[1]])
    }))
    this.g[0].draw(xpts, 'Pred')
    this.g[0].draw(ypts, 'Prey')
    this.g[1].draw(tpts, 'Phase')
  }
}

export class VanDerPol extends DifferentialEquationView {
  initialData = [1, 1]
  end = 25
  static sz = 400

  static V: ((e: number) => Derivative) = e => (x, y) => [
    y[1],
    ((1 - Math.pow(y[0], 2)) * y[1] - y[0]) / e
  ]
  eq = VanDerPol.V(3)

  constructor(elt1: string, elt2: string) {
    super(2, [elt1, elt2], VanDerPol.sz, VanDerPol.sz)
    this.g[0].axes([0, this.end], [-3, 3])
    this.g[1].axes([-3, 3], [-3, 3])
  }

  tweak = (e: MouseEvent) => {
    let x = e.offsetX
    let y = e.offsetY
    this.draw([this.g[1].x.invert(x), this.g[1].y.invert(y)])
  }

  draw(initialData: number[] = this.initialData) {
    let xpts: [number, number][] = []
    let ypts: [number, number][] = []
    let tpts: [number, number][] = []
    this.solver.solve(this.eq, 0, initialData, this.end, this.solver.grid(0.1, (x, y) => {
      xpts.push([x, y[0]])
      ypts.push([x, y[1]])
      tpts.push([y[0], y[1]])
    }))
    this.g[0].draw(xpts, 'Pred')
    this.g[0].draw(ypts, 'Prey')
    this.g[1].draw(tpts)
  }
}
