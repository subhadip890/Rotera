/**
 * RoundtableFallback — Static SVG version of the Roundtable.
 * Used for:
 * - prefers-reduced-motion
 * - Low-end devices
 * - SSR/initial render before 3D loads
 *
 * Same visual language as the 3D version: circular ring with seat dots.
 */

interface FallbackProps {
  /** Number of seats */
  seatCount?: number
  /** Index of current recipient */
  currentRecipientIndex?: number
  /** Which seats have paid */
  paidSeats?: boolean[]
  /** Size in pixels */
  size?: number
  /** Additional CSS class */
  className?: string
}

function RoundtableFallback({
  seatCount = 6,
  currentRecipientIndex = 0,
  paidSeats = [],
  size = 280,
  className = '',
}: FallbackProps) {
  const center = size / 2
  const ringRadius = size * 0.36
  const seatRadius = size * 0.04
  const potRadius = size * 0.08

  const seats = Array.from({ length: seatCount }, (_, i) => {
    const angle = (i / seatCount) * Math.PI * 2 - Math.PI / 2
    const x = center + Math.cos(angle) * ringRadius
    const y = center + Math.sin(angle) * ringRadius
    const isCurrent = i === currentRecipientIndex
    const hasPaid = paidSeats[i] ?? false

    return { x, y, isCurrent, hasPaid, index: i }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Roundtable showing circle member positions"
      role="img"
    >
      {/* Ring track */}
      <circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke="#2F6E62"
        strokeWidth="2"
        opacity="0.3"
      />

      {/* Connection lines from seats to center */}
      {seats.map((seat) => (
        <line
          key={`line-${seat.index}`}
          x1={center}
          y1={center}
          x2={seat.x}
          y2={seat.y}
          stroke="#2F6E62"
          strokeWidth="1"
          opacity="0.15"
        />
      ))}

      {/* Center pot */}
      <circle
        cx={center}
        cy={center}
        r={potRadius}
        fill="#C9973C"
        opacity="0.9"
      />
      <circle
        cx={center}
        cy={center}
        r={potRadius * 0.6}
        fill="none"
        stroke="#FAF8F3"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Seat dots */}
      {seats.map((seat) => (
        <g key={`seat-${seat.index}`}>
          {/* Glow ring for current recipient */}
          {seat.isCurrent && (
            <circle
              cx={seat.x}
              cy={seat.y}
              r={seatRadius * 2.2}
              fill="none"
              stroke="#C9973C"
              strokeWidth="1.5"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                values={`${seatRadius * 1.8};${seatRadius * 2.5};${seatRadius * 1.8}`}
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;0.15;0.4"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Seat dot */}
          <circle
            cx={seat.x}
            cy={seat.y}
            r={seatRadius}
            fill={
              seat.isCurrent
                ? '#C9973C'  // brass — recipient
                : seat.hasPaid
                  ? '#2F6E62'  // verdigris — paid
                  : '#14213D'  // ink — waiting
            }
          />

          {/* Small inner dot to indicate filled state */}
          {(seat.hasPaid || seat.isCurrent) && (
            <circle
              cx={seat.x}
              cy={seat.y}
              r={seatRadius * 0.4}
              fill="#FAF8F3"
              opacity="0.7"
            />
          )}
        </g>
      ))}
    </svg>
  )
}

export default RoundtableFallback
