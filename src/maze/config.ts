export type MazeTheme = 'light' | 'dark'

export const MAZE_CONFIG = {
  baseCellSize: 32,
  restartDelayMs: 1200,
  solutionSpeed: 10,
  solutionEdgeOvershoot: 1,
  wallLineWidth: 1,
  solutionLineWidth: 2
} as const

export function getMazeColors() {
  const styles = getComputedStyle(document.documentElement)
  const solutionColors = styles
    .getPropertyValue('--app-maze-solution-colors')
    .split('|')
    .map((color) => color.trim())
    .filter(Boolean)

  return {
    wallColor: styles.getPropertyValue('--app-maze-wall').trim(),
    solutionColors
  }
}
