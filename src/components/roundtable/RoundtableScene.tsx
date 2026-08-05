import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group } from 'three'
import Seat from './Seat'

interface MemberData {
  address: string
  hasPaid: boolean
  isLate: boolean
}

interface RoundtableSceneProps {
  /** Array of member data for each seat */
  members?: MemberData[]
  /** Index of the current payout recipient (0-based) */
  currentRecipientIndex?: number
  /** Total number of seats (used when members haven't all joined yet) */
  seatCount?: number
  /** Whether to enable the slow idle rotation */
  idleRotation?: boolean
  /** Scale multiplier for responsive sizing */
  scale?: number
}

/**
 * The Roundtable — Rotera's signature 3D element.
 *
 * A circular table with seats arranged in a ring, one per member.
 * As contributions come in, each seat's coin slot fills.
 * The current recipient's seat glows brass.
 *
 * Low-poly aesthetic for performance on mid-range mobile.
 */
function RoundtableScene({
  members = [],
  currentRecipientIndex = 0,
  seatCount = 6,
  idleRotation = true,
  scale = 1,
}: RoundtableSceneProps) {
  const groupRef = useRef<Group>(null)

  const totalSeats = Math.max(seatCount, members.length, 3)

  // Calculate seat positions in a circle
  const seatPositions = useMemo(() => {
    const radius = 1.8
    const positions: [number, number, number][] = []
    for (let i = 0; i < totalSeats; i++) {
      const angle = (i / totalSeats) * Math.PI * 2 - Math.PI / 2
      positions.push([
        Math.cos(angle) * radius,
        0.35,
        Math.sin(angle) * radius,
      ])
    }
    return positions
  }, [totalSeats])

  // Idle rotation: slow, ambient spin (~20s per revolution)
  useFrame((_, delta) => {
    if (groupRef.current && idleRotation) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      {/* Table surface — a wooden disc */}
      <Float speed={0.5} rotationIntensity={0} floatIntensity={0.1}>
        <mesh position={[0, 0, 0]} receiveShadow>
          <cylinderGeometry args={[2.2, 2.3, 0.12, 32]} />
          <meshStandardMaterial
            color="#2a1f14"
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>

        {/* Table rim — a subtle ring */}
        <mesh position={[0, 0.06, 0]}>
          <torusGeometry args={[2.2, 0.04, 8, 32]} />
          <meshStandardMaterial
            color="#14213D"
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>

        {/* Center pot indicator */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.4, 0.35, 0.08, 16]} />
          <meshStandardMaterial
            color="#C9973C"
            roughness={0.3}
            metalness={0.7}
            emissive="#C9973C"
            emissiveIntensity={0.15}
          />
        </mesh>

        {/* Decorative connection ring at mid-radius */}
        <mesh position={[0, 0.08, 0]}>
          <torusGeometry args={[1.0, 0.015, 8, 32]} />
          <meshStandardMaterial color="#2F6E62" opacity={0.25} transparent roughness={0.8} />
        </mesh>
      </Float>

      {/* Seats arranged around the ring */}
      {seatPositions.map((pos, i) => {
        const member = members[i]
        return (
          <Seat
            key={`seat-${i}`}
            position={pos}
            index={i}
            isCurrentRecipient={i === currentRecipientIndex}
            hasPaid={member?.hasPaid ?? false}
            isLate={member?.isLate ?? false}
            totalSeats={totalSeats}
          />
        )
      })}
    </group>
  )
}

export default RoundtableScene
