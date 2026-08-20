import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { t as Roundtable } from "./Roundtable-C29LH-cO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DMthHmXM.js
var import_jsx_runtime = require_jsx_runtime();
var HERO_SEATS = [
	{
		id: "1",
		name: "Priya",
		status: "paid"
	},
	{
		id: "2",
		name: "Tunde",
		status: "paid"
	},
	{
		id: "3",
		name: "Mariela",
		status: "paid"
	},
	{
		id: "4",
		name: "You",
		status: "waiting"
	},
	{
		id: "5",
		name: "Samir",
		status: "late"
	},
	{
		id: "6",
		name: "Nomsa",
		status: "waiting"
	}
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "relative overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					initial: {
						opacity: 0,
						y: 16
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: {
						duration: .55,
						ease: "easeOut"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "num text-xs uppercase tracking-[0.18em] text-verdigris",
							children: "Rotating savings · Stellar testnet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-4 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl",
							children: [
								"Everybody pays in.",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
									className: "font-light italic text-verdigris",
									children: "One person"
								}),
								" takes",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"the pot home."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground",
							children: "It's the arrangement your family already runs — chit fund, susu, tanda, ajo, stokvel. Rotera keeps the group exactly as it is and takes over the part people argue about: who's next, who has paid, and what happens when someone is late."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/create",
								className: "rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90",
								children: "Start a circle"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/join",
								className: "text-verdigris underline underline-offset-4 transition-colors duration-200 hover:text-ink",
								children: "I have an invite link"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 text-sm text-muted-foreground",
							children: "Used by seven test circles across Lagos, Chennai and Cape Town during the testnet run."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					initial: {
						opacity: 0,
						scale: .96
					},
					animate: {
						opacity: 1,
						scale: 1
					},
					transition: {
						duration: .7,
						ease: "easeOut",
						delay: .1
					},
					className: "flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roundtable, {
						seats: HERO_SEATS,
						currentSeat: 3,
						size: 520,
						caption: "Sunday Six · cycle 4 of 6 · 200 XLM each"
					})
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "border-y border-border/70 bg-chalk",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-6xl px-5 py-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-semibold",
					children: "How a circle works"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-10 grid gap-10 md:grid-cols-3",
					children: [
						{
							n: "01",
							h: "Agree once",
							p: "Six people, 200 XLM a week, and an order everyone can see. The order is fixed the moment the circle goes live — the organizer can't move themselves up."
						},
						{
							n: "02",
							h: "Pay your share",
							p: "One tap each week before the cutoff. Rotera shows who has paid and who hasn't, so nobody has to chase anyone in a group chat."
						},
						{
							n: "03",
							h: "Take your turn",
							p: "When the cycle closes, the whole pot — 1,200 XLM — lands with whoever's seat is up. Then the ring turns one notch."
						}
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "num text-sm text-brass",
							children: s.n
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 text-xl font-semibold",
							children: s.h
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 leading-relaxed text-muted-foreground",
							children: s.p
						})
					] }, s.n))
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mx-auto max-w-6xl px-5 py-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-10 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-semibold",
					children: "Never used a wallet? That's fine."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 leading-relaxed text-muted-foreground",
					children: "A wallet is an account you hold yourself — no branch visit, no minimum balance. Rotera never takes custody of your money and never asks you for a password. You approve each payment, and the contract does the rest."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
					className: "grid gap-6 sm:grid-cols-2",
					children: [
						["Contribution", "200 XLM"],
						["Cycle", "Weekly"],
						["Seats", "6"],
						["Pot per cycle", "1,200 XLM"]
					].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-chalk p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-sm text-muted-foreground",
							children: k
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "num mt-1 text-2xl",
							children: v
						})]
					}, k))
				})]
			})
		})
	] });
}
//#endregion
export { Landing as component };
