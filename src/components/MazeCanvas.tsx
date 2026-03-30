import { useMazeCanvas } from '../hooks/useMazeCanvas'

export function MazeCanvas() {
  const canvasRef = useMazeCanvas()

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block size-full pointer-events-none"
    />
  )
}
