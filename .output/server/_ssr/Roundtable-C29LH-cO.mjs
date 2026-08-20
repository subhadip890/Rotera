import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as motion } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Roundtable-C29LH-cO.js
var import_jsx_runtime = require_jsx_runtime();
var COLORS = {
	ink: "#14213D",
	verdigris: "#2F6E62",
	brass: "#C9973C",
	chalk: "#FAF8F3",
	rust: "#B4553B",
	parchment: "#EAE3CF"
};
function seatFill(status) {
	if (status === "paid") return COLORS.verdigris;
	if (status === "late") return COLORS.rust;
	return "transparent";
}
function Roundtable({ seats, currentSeat, size = 320, idle = true, showLabels = true, className, caption }) {
	const cx = 200;
	const cy = 200;
	const r = 132;
	const count = Math.max(seats.length, 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className,
		style: {
			width: size,
			maxWidth: "100%"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 400 400",
			width: "100%",
			role: "img",
			"aria-label": `Rotation ring with ${count} seats. Seat ${currentSeat + 1}, ${seats[currentSeat]?.name ?? "next member"}, receives this cycle's pot.`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
					id: "rt-glow",
					cx: "50%",
					cy: "50%",
					r: "50%",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: COLORS.brass,
						stopOpacity: "0.35"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: COLORS.brass,
						stopOpacity: "0"
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx,
					cy,
					r: 166,
					fill: "url(#rt-glow)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx,
					cy,
					r: 90,
					fill: COLORS.chalk,
					stroke: COLORS.ink,
					strokeOpacity: "0.12"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx,
					cy,
					r,
					fill: "none",
					stroke: COLORS.verdigris,
					strokeOpacity: "0.3",
					strokeWidth: "1.5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					className: idle ? "ring-spin" : void 0,
					style: { transformOrigin: "200px 200px" },
					children: Array.from({ length: 48 }).map((_, i) => {
						const a = i / 48 * Math.PI * 2;
						const rnd = (v) => Number(v.toFixed(2));
						const x1 = rnd(cx + Math.cos(a) * 146);
						const y1 = rnd(cy + Math.sin(a) * 146);
						const x2 = rnd(cx + Math.cos(a) * 152);
						const y2 = rnd(cy + Math.sin(a) * 152);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1,
							y1,
							x2,
							y2,
							stroke: COLORS.ink,
							strokeOpacity: i % 4 === 0 ? .28 : .1,
							strokeWidth: "1"
						}, i);
					})
				}),
				seats.map((seat, i) => {
					const a = i / count * Math.PI * 2 - Math.PI / 2;
					const rnd = (v) => Number(v.toFixed(2));
					const x = rnd(cx + Math.cos(a) * r);
					const y = rnd(cy + Math.sin(a) * r);
					const isCurrent = i === currentSeat;
					const lx = rnd(cx + Math.cos(a) * 174);
					const ly = rnd(cy + Math.sin(a) * 174);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
						isCurrent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.circle, {
							cx: x,
							cy: y,
							r: 26,
							fill: COLORS.brass,
							initial: { opacity: .18 },
							animate: { opacity: [
								.18,
								.34,
								.18
							] },
							transition: {
								duration: 3.2,
								repeat: Infinity,
								ease: "easeInOut"
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.circle, {
							cx: x,
							cy: y,
							r: 17,
							fill: seatFill(seat.status),
							stroke: isCurrent ? COLORS.brass : COLORS.ink,
							strokeOpacity: isCurrent ? 1 : .35,
							strokeWidth: isCurrent ? 2.5 : 1.5,
							initial: false,
							animate: { scale: seat.status === "paid" ? 1 : .96 },
							transition: {
								duration: .25,
								ease: "easeOut"
							},
							style: { transformOrigin: `${x}px ${y}px` }
						}),
						seat.status === "paid" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x,
							y: y + 4,
							textAnchor: "middle",
							fill: COLORS.chalk,
							fontSize: "11",
							fontFamily: "IBM Plex Mono, monospace",
							children: "✓"
						}),
						seat.status === "late" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x,
							y: y + 4,
							textAnchor: "middle",
							fill: COLORS.chalk,
							fontSize: "11",
							fontFamily: "IBM Plex Mono, monospace",
							children: "!"
						}),
						showLabels && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: lx,
							y: ly + 4,
							textAnchor: "middle",
							fill: COLORS.ink,
							fillOpacity: isCurrent ? 1 : .62,
							fontSize: "12",
							fontFamily: "Public Sans, sans-serif",
							fontWeight: isCurrent ? 600 : 400,
							children: seat.name
						})
					] }, seat.id);
				}),
				showLabels && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: cx,
					y: 196,
					textAnchor: "middle",
					fill: COLORS.ink,
					fillOpacity: "0.55",
					fontSize: "11",
					letterSpacing: "1.4",
					fontFamily: "Public Sans, sans-serif",
					children: "THIS CYCLE"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: cx,
					y: 220,
					textAnchor: "middle",
					fill: COLORS.ink,
					fontSize: "22",
					fontFamily: "IBM Plex Mono, monospace",
					children: seats[currentSeat]?.name ?? "—"
				})] })
			]
		}), caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "mt-3 text-center text-sm text-muted-foreground",
			children: caption
		})]
	});
}
//#endregion
export { Roundtable as t };
