import { a as __toESM } from "../_runtime.mjs";
import { n as AnimatePresence } from "../_libs/framer-motion.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { a as formatAmount, i as countdown, n as useRotera, o as potTotal, r as YOU_ID } from "./router-5oc-PNRX.mjs";
import { t as Roundtable } from "./Roundtable-C29LH-cO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/circle-UT8CUCKV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	{
		title: "A circle is a group of people who already trust each other",
		body: "Six friends, one shared agreement: everyone pays the same amount each week, and each week the whole pot goes to one person. After six weeks, everyone has had their turn."
	},
	{
		title: "Rotera only enforces the rules you agreed on",
		body: "Who's next, who has paid, what counts as late. Once the circle is live, nobody can change the order — not even the person who set it up."
	},
	{
		title: "Your wallet is your seat",
		body: "A wallet is just an account you control. Rotera never holds your money and never asks for a password. You approve each payment yourself, and you can walk away from the app at any time."
	},
	{
		title: "You're on testnet",
		body: "Everything here uses test XLM, so nothing costs real money. Try paying a share and closing a cycle before you invite anyone."
	}
];
function Onboarding() {
	const finish = useRotera((s) => s.finishOnboarding);
	const [step, setStep] = (0, import_react.useState)(0);
	const current = STEPS[step];
	const last = step === STEPS.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			initial: {
				opacity: 0,
				y: 12
			},
			animate: {
				opacity: 1,
				y: 0
			},
			transition: {
				duration: .25,
				ease: "easeOut"
			},
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Getting started with Rotera",
			className: "w-full max-w-md rounded-2xl border border-border bg-chalk p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5",
					children: STEPS.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1 flex-1 rounded-full ${i <= step ? "bg-verdigris" : "bg-border"}` }, s.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "num mt-4 text-xs text-muted-foreground",
					children: [
						"Step ",
						step + 1,
						" of ",
						STEPS.length
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 text-2xl font-semibold leading-tight",
					children: current.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted-foreground",
					children: current.body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => last ? finish() : setStep(step + 1),
						className: "rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-ink transition-opacity duration-200 hover:opacity-90",
						children: last ? "Take me to my circle" : "Next"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: finish,
						className: "text-sm text-muted-foreground underline underline-offset-4 hover:text-ink",
						children: "Skip"
					})]
				})
			]
		})
	});
}
function Dashboard() {
	const { circle, wallet, loadDemoCircle, payShare, closeCycle, lastPayout, dismissPayout, onboardingDone } = useRotera();
	const [now, setNow] = (0, import_react.useState)(null);
	const [paying, setPaying] = (0, import_react.useState)(false);
	const [payError, setPayError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setNow(Date.now());
		const t = setInterval(() => setNow(Date.now()), 1e3);
		return () => clearInterval(t);
	}, []);
	if (!circle) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-5 py-20 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roundtable, {
				seats: [
					1,
					2,
					3,
					4,
					5,
					6
				].map((n) => ({
					id: String(n),
					name: "",
					status: "waiting"
				})),
				currentSeat: 0,
				size: 300,
				showLabels: false,
				className: "mx-auto"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 text-3xl font-semibold",
				children: "No circles yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-3 max-w-md text-muted-foreground",
				children: "Create one for a group you already save with, or paste an invite link someone sent you."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-wrap justify-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/create",
					className: "rounded-md bg-brass px-5 py-3 font-semibold text-ink transition-opacity duration-200 hover:opacity-90",
					children: "Start a circle"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: loadDemoCircle,
					className: "rounded-md border border-border bg-chalk px-5 py-3 font-medium transition-colors duration-200 hover:bg-parchment",
					children: "Open the Sunday Six demo"
				})]
			})
		]
	});
	const you = circle.members.find((m) => m.id === YOU_ID);
	const recipient = circle.members[circle.currentSeat];
	const yourTurn = recipient?.id === YOU_ID;
	const recipientLabel = yourTurn ? "you" : recipient?.name ?? "the next seat";
	const paidCount = circle.members.filter((m) => m.status === "paid").length;
	const seats = circle.members.map((m) => ({
		id: m.id,
		name: m.name,
		status: m.status
	}));
	async function handlePay() {
		if (wallet !== "connected") {
			setPayError("Your wallet isn't connected. Connect it from the top right, then pay your share.");
			return;
		}
		setPayError(null);
		setPaying(true);
		await new Promise((r) => setTimeout(r, 900));
		setPaying(false);
		payShare();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		!onboardingDone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboarding, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-5 py-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "num text-xs uppercase tracking-[0.18em] text-verdigris",
					children: [
						"Cycle ",
						circle.currentCycle,
						" of ",
						circle.members.length,
						" · ",
						circle.cadence
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-4xl font-semibold",
					children: circle.name
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/history",
					className: "text-verdigris underline underline-offset-4 transition-colors duration-200 hover:text-ink",
					children: "See the full record"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-8 lg:grid-cols-[380px_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roundtable, {
					seats,
					currentSeat: circle.currentSeat,
					size: 380,
					caption: `${yourTurn ? "It's your turn — you receive" : `${recipient?.name} receives`} ${formatAmount(potTotal(circle))} XLM this cycle`
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Your share",
									value: `${formatAmount(circle.amount)} XLM`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Cutoff in",
									value: now === null ? "—" : countdown(circle.cutoff, now)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Paid so far",
									value: `${paidCount} of ${circle.members.length}`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-xl border border-border bg-chalk p-5",
							children: you?.status === "paid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-verdigris",
									children: "Your 200 XLM is in for this cycle."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: [
										"Nothing else to do until ",
										recipientLabel,
										" ",
										yourTurn ? "are" : "is",
										" ",
										"paid out and the ring turns."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: closeCycle,
									className: "mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-parchment",
									children: ["Simulate cutoff and pay out ", recipientLabel]
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-medium",
									children: [formatAmount(circle.amount), " XLM due before the cutoff"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: yourTurn ? "It goes into your own payout this cycle — Rotera never holds it." : `Goes straight to ${recipient?.name}'s payout — Rotera never holds it.`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void handlePay(),
									disabled: paying,
									className: "mt-4 w-full rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 sm:w-auto",
									children: paying ? "Approve it in your wallet…" : "Pay my share"
								}),
								payError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									role: "alert",
									className: "mt-3 rounded-md border border-rust/40 bg-rust/10 p-3 text-sm text-rust",
									children: payError
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "overflow-hidden rounded-xl border border-border bg-chalk",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "border-b border-border px-5 py-3.5 text-sm font-semibold",
								children: "This cycle"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: circle.members.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 border-b border-border/60 px-5 py-3.5 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "num w-7 text-sm text-muted-foreground",
										children: String(i + 1).padStart(2, "0")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: m.name
									}),
									i === circle.currentSeat && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-brass/20 px-2 py-0.5 text-xs font-medium text-ink",
										children: "their turn"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "num ml-auto text-sm text-muted-foreground",
										children: m.address
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: m.status })
								]
							}, m.id)) })]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: lastPayout && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
			className: "fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				initial: {
					scale: .94,
					y: 10
				},
				animate: {
					scale: 1,
					y: 0
				},
				transition: {
					duration: .32,
					ease: "easeOut"
				},
				role: "dialog",
				"aria-modal": "true",
				className: "w-full max-w-md rounded-2xl border border-brass/60 bg-chalk p-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "num text-xs uppercase tracking-[0.18em] text-verdigris",
						children: [
							"Cycle ",
							lastPayout.cycle,
							" closed"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 font-display text-5xl font-light text-brass",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "num",
							children: formatAmount(lastPayout.amount)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "num mt-1 text-sm text-muted-foreground",
						children: "XLM"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mt-5 text-2xl font-semibold",
						children: [lastPayout.recipient, " received this week's payout"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-muted-foreground",
						children: [
							"The ring has turned. Next up is",
							" ",
							circle.members[circle.currentSeat]?.name,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: dismissPayout,
						className: "mt-6 rounded-md bg-ink px-5 py-3 font-medium text-chalk transition-opacity duration-200 hover:opacity-90",
						children: "Back to the circle"
					})
				]
			})
		}) })
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-chalk p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "num mt-1 text-2xl",
			children: value
		})]
	});
}
function StatusPill({ status }) {
	const [text, cls] = {
		paid: ["Paid", "bg-verdigris/15 text-verdigris"],
		waiting: ["Waiting", "bg-muted text-muted-foreground"],
		late: ["Late", "bg-rust/15 text-rust"]
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-full px-2.5 py-1 text-xs font-medium ${cls}`,
		children: text
	});
}
//#endregion
export { Dashboard as component };
