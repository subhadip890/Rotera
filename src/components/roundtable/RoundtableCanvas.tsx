import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import RoundtableScene from './RoundtableScene'
import RoundtableFallback from './RoundtableFallback'

interface RoundtableCanvasProps {
  /** Number of seats in the circle */
  seatCount?: number
  /** Current recipient index */
  currentRecipientIndex?: number
  /** Member data for seat states */
  members?: Array<{ address: string; hasPaid: boolean; isLate: boolean }>
  /** Height of the canvas container */
  height?: string
  /** Whether to show in compact/dashboard mode */
  compact?: boolean
  /** Additional CSS class */
  className?: string
}

/**
 * RoundtableCanvas — wrapper that handles:
 * 1. prefers-reduced-motion → shows SVG fallback
 * 2. WebGL support check → falls back if no WebGL
 * 3. Suspense loading → shows fallback while 3D loads
 * 4. Responsive sizing
 */
function RoundtableCanvas({
  seatCount = 6,
  currentRecipientIndex = 0,
  members = [],
  height = '500px',
  compact = false,
  className = '',
}: RoundtableCanvasProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)

  useEffect(() => {
    // Check reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setHasWebGL(!!gl)
    } catch {
      setHasWebGL(false)
    }

    return () => mq.removeEventListener('change', handler)
  }, [])

  // Show SVG fallback for reduced motion or no WebGL
  if (prefersReducedMotion || !hasWebGL) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <RoundtableFallback
          seatCount={seatCount}
          currentRecipientIndex={currentRecipientIndex}
          paidSeats={members.map(m => m.hasPaid)}
          size={compact ? 200 : 300}
        />
      </div>
    )
  }

  const cameraPosition: [number, number, number] = compact
    ? [0, 3.5, 3]
    : [0, 4.5, 4]

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={compact ? 40 : 35}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          color="#FAF8F3"
        />
        <directionalLight
          position={[-3, 4, -2]}
          intensity={0.3}
          color="#2F6E62"
        />

        {/* The Roundtable */}
        <Suspense fallback={null}>
          <RoundtableScene
            members={members}
            currentRecipientIndex={currentRecipientIndex}
            seatCount={seatCount}
            idleRotation={!compact}
            scale={compact ? 0.8 : 1}
          />
        </Suspense>

        {/* Controls — limited for hero, interactive for dashboard */}
        <OrbitControls
          enableZoom={compact}
          enablePan={false}
          autoRotate={!compact}
          autoRotateSpeed={compact ? 0 : 0.5}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 5}
        />
      </Canvas>
    </div>
  )
}

export default RoundtableCanvas
