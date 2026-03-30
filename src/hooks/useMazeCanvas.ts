import { useEffect, useRef } from 'react'
import type { Cell } from '../maze/Cell'
import { MAZE_CONFIG, getMazeColors, type MazeTheme } from '../maze/config'
import { generateMaze, solveMaze } from '../maze/helpers'
import { createMazeRenderState, getMazeSize, renderMazeFrame } from '../maze/render'

type MazeState = {
  cols: number
  rows: number
  grid: Cell[]
  solutionPath: Cell[]
  solutionColor: string
}

type MazePhase = 'solving' | 'cooldown'

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
    let restartTimeoutId = 0
    let progress = 0
    let lastTimestamp = 0
    let phase: MazePhase = 'solving'
    let currentTheme: MazeTheme = 'light'
    let mazeState: MazeState | undefined
    let renderState: ReturnType<typeof createMazeRenderState> | undefined

    const getTheme = (): MazeTheme =>
      document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

    const pickRandomColor = (colors: string[]) => colors[Math.floor(Math.random() * colors.length)]

    const createMazeState = (cols: number, rows: number, solutionColors: string[]): MazeState => {
      const grid = generateMaze(cols, rows)

      return {
        cols,
        rows,
        grid,
        solutionPath: solveMaze(cols, rows, grid),
        solutionColor: pickRandomColor(solutionColors)
      }
    }

    const stopAnimation = () => {
      if (!animationFrameId) {
        return
      }

      cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }

    const clearRestartTimeout = () => {
      if (!restartTimeoutId) {
        return
      }

      window.clearTimeout(restartTimeoutId)
      restartTimeoutId = 0
    }

    const render = () => {
      if (!renderState) {
        return
      }

      renderMazeFrame(ctx, renderState, progress)
    }

    const startSolving = () => {
      if (!renderState || animationFrameId || phase !== 'solving') {
        return
      }

      clearRestartTimeout()
      animationFrameId = requestAnimationFrame(animate)
    }

    const scheduleRestart = () => {
      if (restartTimeoutId || !mazeState || phase !== 'cooldown') {
        return
      }

      restartTimeoutId = window.setTimeout(() => {
        if (!mazeState) {
          return
        }

        const mazeColors = getMazeColors()
        currentTheme = getTheme()
        restartTimeoutId = 0
        mazeState = createMazeState(mazeState.cols, mazeState.rows, mazeColors.solutionColors)
        progress = 0
        lastTimestamp = 0
        phase = 'solving'
        draw()
        startSolving()
      }, MAZE_CONFIG.restartDelayMs)
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
        return
      }

      phase = 'cooldown'
      scheduleRestart()
    }

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()

      if (!width || !height) {
        return
      }

      const mazeColors = getMazeColors()
      const theme = getTheme()

      if (!mazeState) {
        const { cols, rows } = getMazeSize(width, height)
        currentTheme = theme
        mazeState = createMazeState(cols, rows, mazeColors.solutionColors)
      } else if (currentTheme !== theme) {
        currentTheme = theme
        mazeState = {
          ...mazeState,
          solutionColor: pickRandomColor(mazeColors.solutionColors)
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
        pixelRatio,
        mazeColors.wallColor,
        mazeState.solutionColor,
        currentTheme
      )

      render()
    }

    const resizeObserver = new ResizeObserver(draw)
    const themeObserver = new MutationObserver(draw)

    resizeObserver.observe(canvas)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    draw()
    startSolving()

    return () => {
      stopAnimation()
      clearRestartTimeout()
      resizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [])

  return canvasRef
}
