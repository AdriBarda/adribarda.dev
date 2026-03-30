import { Cell, type Walls } from './Cell'

type Direction = {
  dx: number
  dy: number
  wall: keyof Walls
  opposite: keyof Walls
}

const DIRECTIONS: Direction[] = [
  { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
  { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
  { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
  { dx: -1, dy: 0, wall: 'left', opposite: 'right' }
]

function getCell(grid: Cell[], x: number, y: number, cols: number, rows: number) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) {
    return null
  }

  return grid[y * cols + x] ?? null
}

function getNeighborEntries(cell: Cell, grid: Cell[], cols: number, rows: number) {
  return DIRECTIONS.flatMap((direction) => {
    const neighbor = getCell(grid, cell.x + direction.dx, cell.y + direction.dy, cols, rows)

    return neighbor ? [{ direction, neighbor }] : []
  })
}

function createGrid(cols: number, rows: number): Cell[] {
  const grid: Cell[] = []

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      grid.push(new Cell(x, y))
    }
  }

  return grid
}

function carvePassage(current: Cell, next: Cell, direction: Direction) {
  current.walls[direction.wall] = false
  next.walls[direction.opposite] = false
}

function openMazePerimeter(grid: Cell[]) {
  const start = grid[0]
  const goal = grid[grid.length - 1]

  if (start) {
    start.walls.top = false
  }

  if (goal) {
    goal.walls.bottom = false
  }
}

export function generateMaze(cols: number, rows: number): Cell[] {
  const grid = createGrid(cols, rows)
  const start = grid[0]

  if (!start) {
    return grid
  }

  const stack = [start]
  start.visited = true

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const choices = getNeighborEntries(current, grid, cols, rows).filter(
      ({ neighbor }) => !neighbor.visited
    )

    if (choices.length === 0) {
      stack.pop()
      continue
    }

    const choice = choices[Math.floor(Math.random() * choices.length)]

    carvePassage(current, choice.neighbor, choice.direction)
    choice.neighbor.visited = true
    stack.push(choice.neighbor)
  }

  grid.forEach((cell) => {
    cell.visited = false
  })

  openMazePerimeter(grid)

  return grid
}

export function solveMaze(cols: number, rows: number, grid: Cell[]): Cell[] {
  const start = grid[0]
  const goal = grid[grid.length - 1]

  if (!start || !goal) {
    return []
  }

  const queue = [start]
  const visited = new Set<Cell>([start])
  const previous = new Map<Cell, Cell | null>([[start, null]])

  while (queue.length > 0) {
    const current = queue.shift()

    if (!current || current === goal) {
      break
    }

    getNeighborEntries(current, grid, cols, rows).forEach(({ direction, neighbor }) => {
      if (current.walls[direction.wall] || visited.has(neighbor)) {
        return
      }

      visited.add(neighbor)
      previous.set(neighbor, current)
      queue.push(neighbor)
    })
  }

  if (!previous.has(goal)) {
    return []
  }

  const path: Cell[] = []

  for (let current: Cell | null = goal; current; current = previous.get(current) ?? null) {
    path.push(current)
  }

  path.reverse()
  return path
}
