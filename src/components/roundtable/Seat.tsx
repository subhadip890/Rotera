import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, PointLight } from 'three'

interface SeatProps {
  position: [number, number, number]
  index: number
  isCurrentRecipient: boolean
  hasPaid: boolean
  isLate: boolean
  totalSeats: number
}

/**
 * Individual seat around the Roundtable.
 * A low-poly chair/stool with a coin slot that fills based on payment status.
 */
function Seat({ position, isCurrentRecipient, hasPaid, isLate }: SeatProps) {
  const meshRef = useRef<Mesh>(null)
  const glowRef = useRef<PointLight>(null)

  // Color logic: brass for current recipient, verdigris for paid, rust for late, ink-muted for waiting
  const seatColor = useMemo(() => {
    if (isCurrentRecipient) return '#C9973C'  // brass
    if (hasPaid) return '#2F6E62'              // verdigris
    if (isLate) return '#B4553B'               // rust-signal
    return '#14213D'                            // ink (waiting)
  }, [isCurrentRecipient, hasPaid, isLate])

  // Subtle hover glow for the current recipient
  useFrame((_, delta) => {
    if (glowRef.current && isCurrentRecipient) {
      glowRef.current.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5
    }
    // Gentle bob for current recipient seat
    if (meshRef.current && isCurrentRecipient) {
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.05
    }
    if (meshRef.current && !isCurrentRecipient) {
      meshRef.current.position.y += (position[1] - meshRef.current.position.y) * delta * 2
    }
  })

  return (
    <group position={position}>
      {/* Seat base — rounded cylinder */}
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.15, 8]} />
        <meshStandardMaterial
          color={seatColor}
          roughness={0.6}
          metalness={isCurrentRecipient ? 0.5 : 0.2}
        />
      </mesh>

      {/* Coin slot indicator on top */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
        <meshStandardMaterial
          color={hasPaid || isCurrentRecipient ? seatColor : '#EAE3CF'}
          roughness={0.4}
          metalness={hasPaid ? 0.6 : 0.1}
          emissive={isCurrentRecipient ? '#C9973C' : '#000000'}
          emissiveIntensity={isCurrentRecipient ? 0.3 : 0}
        />
      </mesh>

      {/* Brass glow light for the recipient seat */}
      {isCurrentRecipient && (
        <pointLight
          ref={glowRef}
          position={[0, 0.4, 0]}
          color="#C9973C"
          intensity={1.5}
          distance={2}
          decay={2}
        />
      )}
    </group>
  )
}

export default Seat
