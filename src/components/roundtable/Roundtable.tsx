import { motion } from "motion/react";
import type { SeatStatus } from "@/lib/rotera";

export type Seat = {
  id: string;
  name: string;
  status: SeatStatus;
};

type Props = {
  seats: Seat[];
  currentSeat: number;
  size?: number;
  idle?: boolean;
  showLabels?: boolean;
  className?: string;
  caption?: string;
};

const COLORS = {
  ink: "#14213D",
  verdigris: "#2F6E62",
  brass: "#C9973C",
  chalk: "#FAF8F3",
  rust: "#B4553B",
  parchment: "#EAE3CF",
};

function seatFill(status: SeatStatus) {
  if (status === "paid") return COLORS.verdigris;
  if (status === "late") return COLORS.rust;
  return "transparent";
}

export function Roundtable({
  seats,
  currentSeat,
  size = 320,
  idle = true,
  showLabels = true,
  className,
  caption,
}: Props) {
  const cx = 200;
  const cy = 200;
  const r = 132;
  const count = Math.max(seats.length, 1);

  return (
    <figure className={className} style={{ width: size, maxWidth: "100%" }}>
      <svg
        viewBox="0 0 400 400"
        width="100%"
        role="img"
        aria-label={`Rotation ring with ${count} seats. Seat ${currentSeat + 1}, ${
          seats[currentSeat]?.name ?? "next member"
        }, receives this cycle's pot.`}
      >
        <defs>
          <radialGradient id="rt-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COLORS.brass} stopOpacity="0.35" />
            <stop offset="100%" stopColor={COLORS.brass} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={r + 34} fill="url(#rt-glow)" />

        {/* the table */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 42}
          fill={COLORS.chalk}
          stroke={COLORS.ink}
          strokeOpacity="0.12"
        />

        {/* the rotation ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={COLORS.verdigris}
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />

        {/* slow ambient tick marks */}
        <g className={idle ? "ring-spin" : undefined} style={{ transformOrigin: "200px 200px" }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const rnd = (v: number) => Number(v.toFixed(2));
            const x1 = rnd(cx + Math.cos(a) * (r + 14));
            const y1 = rnd(cy + Math.sin(a) * (r + 14));
            const x2 = rnd(cx + Math.cos(a) * (r + 20));
            const y2 = rnd(cy + Math.sin(a) * (r + 20));
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLORS.ink}
                strokeOpacity={i % 4 === 0 ? 0.28 : 0.1}
                strokeWidth="1"
              />
            );
          })}
        </g>

        {seats.map((seat, i) => {
          const a = (i / count) * Math.PI * 2 - Math.PI / 2;
          const rnd = (v: number) => Number(v.toFixed(2));
          const x = rnd(cx + Math.cos(a) * r);
          const y = rnd(cy + Math.sin(a) * r);
          const isCurrent = i === currentSeat;
          const lx = rnd(cx + Math.cos(a) * (r + 42));
          const ly = rnd(cy + Math.sin(a) * (r + 42));

          return (
            <g key={seat.id}>
              {isCurrent && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={26}
                  fill={COLORS.brass}
                  initial={{ opacity: 0.18 }}
                  animate={{ opacity: [0.18, 0.34, 0.18] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.circle
                cx={x}
                cy={y}
                r={17}
                fill={seatFill(seat.status)}
                stroke={isCurrent ? COLORS.brass : COLORS.ink}
                strokeOpacity={isCurrent ? 1 : 0.35}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                initial={false}
                animate={{ scale: seat.status === "paid" ? 1 : 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {seat.status === "paid" && (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={COLORS.chalk}
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  ✓
                </text>
              )}
              {seat.status === "late" && (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={COLORS.chalk}
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  !
                </text>
              )}
              {showLabels && (
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor="middle"
                  fill={COLORS.ink}
                  fillOpacity={isCurrent ? 1 : 0.62}
                  fontSize="12"
                  fontFamily="Public Sans, sans-serif"
                  fontWeight={isCurrent ? 600 : 400}
                >
                  {seat.name}
                </text>
              )}
            </g>
          );
        })}

        {/* centre: the pot */}
        {showLabels && (
        <>
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={COLORS.ink}
          fillOpacity="0.55"
          fontSize="11"
          letterSpacing="1.4"
          fontFamily="Public Sans, sans-serif"
        >
          THIS CYCLE
        </text>
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fill={COLORS.ink}
          fontSize="22"
          fontFamily="IBM Plex Mono, monospace"
        >
          {seats[currentSeat]?.name ?? "—"}
        </text>
        </>
        )}
      </svg>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
