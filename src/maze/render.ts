import type { Cell } from './Cell'
import { MAZE_CONFIG } from './config'

type Point = {
  x: number
  y: number
}

export type MazeRenderState = {
  width: number
  height: number
  offsetX: number
  offsetY: number
  pixelRatio: number
  mazePath: Path2D
  solutionPoints: Point[]
  maxProgress: number
  wallColor: string
  solutionColor: string
}

function getMazeThemeColors() {
  const styles = getComputedStyle(document.documentElement)

  return {
    wallColor: styles.getPropertyValue('--app-maze-wall').trim() || 'rgba(0,0,0,0.32)',
    solutionColor: styles.getPropertyValue('--app-maze-solution').trim() || '#dc2626'
  }
}

function addAlignedLine(
  path: Path2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  pixelOffset: number,
  maxX: number,
  maxY: number
) {
  const alignX = (value: number) => {
    if (value === 0) {
      return value + pixelOffset
    }

    if (value === maxX) {
      return value - pixelOffset
    }

    return value + pixelOffset
  }

  const alignY = (value: number) => {
    if (value === 0) {
      return value + pixelOffset
    }

    if (value === maxY) {
      return value - pixelOffset
    }

    return value + pixelOffset
  }

  const x1 = startX === endX ? alignX(startX) : startX
  const x2 = startX === endX ? alignX(endX) : endX
  const y1 = startY === endY ? alignY(startY) : startY
  const y2 = startY === endY ? alignY(endY) : endY

  path.moveTo(x1, y1)
  path.lineTo(x2, y2)
}

function buildMazePath(
  grid: Cell[],
  cols: number,
  rows: number,
  pixelRatio: number,
  cellWidth: number,
  cellHeight: number
) {
  const path = new Path2D()
  const pixelOffset = 0.5 / pixelRatio
  const maxX = cols * cellWidth
  const maxY = rows * cellHeight

  grid.forEach((cell) => {
    const x = cell.x * cellWidth
    const y = cell.y * cellHeight

    if (cell.walls.top) {
      addAlignedLine(path, x, y, x + cellWidth, y, pixelOffset, maxX, maxY)
    }

    if (cell.walls.left) {
      addAlignedLine(path, x, y + cellHeight, x, y, pixelOffset, maxX, maxY)
    }

    if (cell.x === cols - 1 && cell.walls.right) {
      addAlignedLine(path, x + cellWidth, y, x + cellWidth, y + cellHeight, pixelOffset, maxX, maxY)
    }

    if (cell.y === rows - 1 && cell.walls.bottom) {
      addAlignedLine(path, x + cellWidth, y + cellHeight, x, y + cellHeight, pixelOffset, maxX, maxY)
    }
  })

  return path
}

function getCellCenter(cell: Cell, cellWidth: number, cellHeight: number): Point {
  return {
    x: cell.x * cellWidth + cellWidth / 2,
    y: cell.y * cellHeight + cellHeight / 2
  }
}

function getSolutionPoints(path: Cell[], cellWidth: number, cellHeight: number) {
  if (path.length === 0) {
    return []
  }

  const points = path.map((cell) => getCellCenter(cell, cellWidth, cellHeight))
  const start = points[0]
  const end = points[points.length - 1]

  return [
    { x: start.x, y: start.y - cellHeight / 2 },
    ...points,
    { x: end.x, y: end.y + cellHeight / 2 }
  ]
}

function drawSolution(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  progress: number,
  solutionColor: string
) {
  if (points.length === 0) {
    return
  }

  ctx.strokeStyle = solutionColor
  ctx.lineWidth = MAZE_CONFIG.solutionLineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  if (points.length === 1) {
    ctx.lineTo(points[0].x, points[0].y)
    ctx.stroke()
    return
  }

  const clampedProgress = Math.max(0, Math.min(progress, points.length - 1))
  const completedSegments = Math.floor(clampedProgress)
  const remainder = clampedProgress - completedSegments

  for (let index = 1; index <= completedSegments; index += 1) {
    ctx.lineTo(points[index].x, points[index].y)
  }

  if (completedSegments < points.length - 1) {
    const start = points[completedSegments]
    const end = points[completedSegments + 1]

    ctx.lineTo(start.x + (end.x - start.x) * remainder, start.y + (end.y - start.y) * remainder)
  }

  ctx.stroke()
}

export function getMazeSize(width: number, height: number) {
  return {
    cols: Math.max(1, Math.floor(width / MAZE_CONFIG.baseCellSize)),
    rows: Math.max(1, Math.floor(height / MAZE_CONFIG.baseCellSize))
  }
}

export function createMazeRenderState(
  grid: Cell[],
  solutionPath: Cell[],
  cols: number,
  rows: number,
  width: number,
  height: number,
  pixelRatio: number
): MazeRenderState {
  const cellWidth = width / cols
  const cellHeight = height / rows
  const solutionPoints = getSolutionPoints(solutionPath, cellWidth, cellHeight)
  const { wallColor, solutionColor } = getMazeThemeColors()

  return {
    width,
    height,
    offsetX: 0,
    offsetY: 0,
    pixelRatio,
    mazePath: buildMazePath(grid, cols, rows, pixelRatio, cellWidth, cellHeight),
    solutionPoints,
    maxProgress: Math.max(solutionPoints.length - 1, 0),
    wallColor,
    solutionColor
  }
}

export function renderMazeFrame(
  ctx: CanvasRenderingContext2D,
  renderState: MazeRenderState,
  progress: number
) {
  ctx.clearRect(0, 0, renderState.width, renderState.height)
  ctx.save()
  ctx.translate(renderState.offsetX, renderState.offsetY)
  ctx.strokeStyle = renderState.wallColor
  ctx.lineWidth = MAZE_CONFIG.wallLineWidth / renderState.pixelRatio
  ctx.stroke(renderState.mazePath)
  drawSolution(ctx, renderState.solutionPoints, progress, renderState.solutionColor)
  ctx.restore()
}
