export type Walls = {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

export class Cell {
  x: number
  y: number
  visited = false
  walls: Walls = {
    top: true,
    right: true,
    bottom: true,
    left: true
  }

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}
