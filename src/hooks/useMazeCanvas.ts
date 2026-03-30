import { useEffect, useRef } from 'react'
import type { Cell } from '../maze/Cell'
import { MAZE_CONFIG } from '../maze/config'
import { generateMaze, solveMaze } from '../maze/helpers'
import { createMazeRenderState, getMazeSize, renderMazeFrame } from '../maze/render'

type MazeState = {
  cols: number
  rows: number
  grid: Cell[]
  solutionPath: Cell[]
}

export function useMazeCanvas() {
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
    let progress = 0
    let lastTimestamp = 0
    let mazeState: MazeState | undefined
    let renderState: ReturnType<typeof createMazeRenderState> | undefined

    const stopAnimation = () => {
      if (!animationFrameId) {
        return
      }

      cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }

    const render = () => {
      if (!renderState) {
        return
      }

      renderMazeFrame(ctx, renderState, progress)
    }

    const animate = (timestamp: number) => {
      animationFrameId = 0

      if (!renderState) {
        return
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp
      }

      const deltaSeconds = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp
      progress = Math.min(renderState.maxProgress, progress + deltaSeconds * MAZE_CONFIG.solutionSpeed)

      render()

      if (progress < renderState.maxProgress) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()

      if (!width || !height) {
        return
      }

      if (!mazeState) {
        const { cols, rows } = getMazeSize(width, height)
        const grid = generateMaze(cols, rows)

        mazeState = {
          cols,
          rows,
          grid,
          solutionPath: solveMaze(cols, rows, grid)
        }
      }

      const pixelRatio = Math.max(window.devicePixelRatio || 1, 1)

      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      renderState = createMazeRenderState(
        mazeState.grid,
        mazeState.solutionPath,
        mazeState.cols,
        mazeState.rows,
        width,
        height,
        pixelRatio
      )

      render()

      if (!animationFrameId && progress < renderState.maxProgress) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    const resizeObserver = new ResizeObserver(draw)
    const themeObserver = new MutationObserver(draw)

    resizeObserver.observe(canvas)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    draw()

    return () => {
      stopAnimation()
      resizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [])

  return canvasRef
}
