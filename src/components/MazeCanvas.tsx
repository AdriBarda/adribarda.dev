import { useEffect, useRef } from 'react'
import type { Cell } from '../maze/Cell'
import { generateMaze, solveMaze } from '../maze/helpers'

const CELL_SIZE = 32
const SOLUTION_SPEED = 33

type Point = {
  x: number
  y: number
}

function getOffset(size: number) {
  const cells = Math.max(1, Math.floor(size / CELL_SIZE))
  return (size - cells * CELL_SIZE) / 2
}

function getMazeLayout(width: number, height: number) {
  const cols = Math.max(1, Math.floor(width / CELL_SIZE))
  const rows = Math.max(1, Math.floor(height / CELL_SIZE))

  return {
    cols,
    rows,
    offsetX: getOffset(width),
    offsetY: getOffset(height)
  }
}

function addAlignedLine(
  path: Path2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  pixelOffset: number
) {
  const x1 = startX === endX ? startX + pixelOffset : startX
  const x2 = startX === endX ? endX + pixelOffset : endX
  const y1 = startY === endY ? startY + pixelOffset : startY
  const y2 = startY === endY ? endY + pixelOffset : endY

  path.moveTo(x1, y1)
  path.lineTo(x2, y2)
}

function buildMazePath(grid: Cell[], cols: number, rows: number, pixelRatio: number) {
  const path = new Path2D()
  const pixelOffset = 0.5 / pixelRatio

  grid.forEach((cell) => {
    const x = cell.x * CELL_SIZE
    const y = cell.y * CELL_SIZE

    if (cell.walls.top) {
      addAlignedLine(path, x, y, x + CELL_SIZE, y, pixelOffset)
    }

    if (cell.walls.left) {
      addAlignedLine(path, x, y + CELL_SIZE, x, y, pixelOffset)
    }

    if (cell.x === cols - 1 && cell.walls.right) {
      addAlignedLine(path, x + CELL_SIZE, y, x + CELL_SIZE, y + CELL_SIZE, pixelOffset)
    }

    if (cell.y === rows - 1 && cell.walls.bottom) {
      addAlignedLine(path, x + CELL_SIZE, y + CELL_SIZE, x, y + CELL_SIZE, pixelOffset)
    }
  })

  return path
}

function getCellCenter(cell: Cell): Point {
  return {
    x: cell.x * CELL_SIZE + CELL_SIZE / 2,
    y: cell.y * CELL_SIZE + CELL_SIZE / 2
  }
}

function getSolutionPoints(path: Cell[], offsetY: number) {
  if (path.length === 0) {
    return []
  }

  const points = path.map(getCellCenter)
  const start = points[0]
  const end = points[points.length - 1]

  return [
    { x: start.x, y: start.y - CELL_SIZE / 2 - offsetY },
    ...points,
    { x: end.x, y: end.y + CELL_SIZE / 2 + offsetY }
  ]
}

function drawSolution(ctx: CanvasRenderingContext2D, points: Point[], progress: number) {
  if (points.length === 0) {
    return
  }

  ctx.strokeStyle = '#dc2626'
  ctx.lineWidth = 3
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

function renderFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  pixelRatio: number,
  mazePath: Path2D,
  solutionPoints: Point[],
  progress: number
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'
  ctx.lineWidth = 1 / pixelRatio
  ctx.stroke(mazePath)
  drawSolution(ctx, solutionPoints, progress)
  ctx.restore()
}

export function MazeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return
    }

    let animationFrameId = 0

    const stopAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = 0
      }
    }

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()

      if (!width || !height) {
        return
      }

      const pixelRatio = Math.max(window.devicePixelRatio || 1, 1)
      const { cols, rows, offsetX, offsetY } = getMazeLayout(width, height)
      const grid = generateMaze(cols, rows)
      const solutionPoints = getSolutionPoints(solveMaze(cols, rows, grid), offsetY)
      const mazePath = buildMazePath(grid, cols, rows, pixelRatio)
      const maxProgress = Math.max(solutionPoints.length - 1, 0)

      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      let progress = 0
      let lastTimestamp = 0

      const render = (currentProgress: number) => {
        renderFrame(
          ctx,
          width,
          height,
          offsetX,
          offsetY,
          pixelRatio,
          mazePath,
          solutionPoints,
          currentProgress
        )
      }

      const animate = (timestamp: number) => {
        if (lastTimestamp === 0) {
          lastTimestamp = timestamp
        }

        const deltaSeconds = (timestamp - lastTimestamp) / 1000
        lastTimestamp = timestamp
        progress = Math.min(maxProgress, progress + deltaSeconds * SOLUTION_SPEED)

        render(progress)

        if (progress < maxProgress) {
          animationFrameId = requestAnimationFrame(animate)
        }
      }

      stopAnimation()
      render(0)

      if (maxProgress > 0) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(canvas)
    draw()

    return () => {
      stopAnimation()
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block size-full pointer-events-none"
    />
  )
}
