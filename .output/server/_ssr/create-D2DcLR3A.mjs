import { a as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as randomizeOrder } from "./router-5oc-PNRX.mjs";
import { t as Roundtable } from "./Roundtable-C29LH-cO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-D2DcLR3A.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CreateCircle() {
	const [name, setName] = (0, import_react.useState)("Sunday Six");
	const [amount, setAmount] = (0, import_react.useState)("200");
	const [cadence, setCadence] = (0, import_react.useState)("Weekly");
	const [members, setMembers] = (0, import_react.useState)([
		"Priya",
		"Tunde",
		"Mariela",
		"You",
		"Samir",
		"Nomsa"
	]);
	const [seed, setSeed] = (0, import_react.useState)(null);
	const [invite, setInvite] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const seats = members.map((m, i) => ({
		id: `${i}-${m}`,
		name: m || `Seat ${i + 1}`,
		status: "waiting"
	}));
	const potPerCycle = (Number(amount) || 0) * members.length;
	function updateMember(i, value) {
		setMembers((prev) => prev.map((m, idx) => idx === i ? value : m));
	}
	function submit(e) {
		e.preventDefault();
		if (members.some((m) => !m.trim())) {
			setError("Every seat needs a name. Fill the blank seats or remove them.");
			return;
		}
		if (!Number(amount) || Number(amount) <= 0) {
			setError("Set a contribution above 0 XLM — that's the amount each seat pays.");
			return;
		}
		setError(null);
		setInvite(`rotera.app/join/${name.toLowerCase().replace(/\s+/g, "-")}-4f2a`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[1fr_400px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-semibold",
				children: "Start a circle"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-muted-foreground",
				children: "Write down the agreement your group already made. Once the first person joins, the amount, the schedule and the order can't be changed by anyone — including you."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "mt-10 space-y-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-5 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Circle name",
								htmlFor: "c-name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "c-name",
									value: name,
									onChange: (e) => setName(e.target.value),
									className: "input"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Contribution per person (XLM)",
								htmlFor: "c-amount",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "c-amount",
									inputMode: "decimal",
									value: amount,
									onChange: (e) => setAmount(e.target.value),
									className: "input num"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "How often",
								htmlFor: "c-cadence",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									id: "c-cadence",
									value: cadence,
									onChange: (e) => setCadence(e.target.value),
									className: "input",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Weekly" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Every two weeks" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Monthly" })
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Seats",
								htmlFor: "c-seats",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setMembers((m) => m.slice(0, Math.max(2, m.length - 1))),
											className: "size-11 rounded-md border border-border bg-chalk text-lg transition-colors duration-200 hover:bg-parchment",
											"aria-label": "Remove a seat",
											children: "−"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											id: "c-seats",
											className: "num w-10 text-center text-lg",
											children: members.length
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setMembers((m) => [...m, ""]),
											className: "size-11 rounded-md border border-border bg-chalk text-lg transition-colors duration-200 hover:bg-parchment",
											"aria-label": "Add a seat",
											children: "+"
										})
									]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl font-semibold",
								children: "Payout order"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const { order, seed: s } = randomizeOrder(members);
									setMembers(order);
									setSeed(s);
								},
								className: "rounded-md border border-verdigris px-3 py-2 text-sm text-verdigris transition-colors duration-200 hover:bg-verdigris hover:text-chalk",
								children: "Randomize for me"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Type the order your group agreed on, or draw it here in front of everyone."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-4 space-y-2",
							children: members.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "num w-7 text-sm text-muted-foreground",
									children: String(i + 1).padStart(2, "0")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: m,
									onChange: (e) => updateMember(i, e.target.value),
									placeholder: "Name",
									"aria-label": `Seat ${i + 1} name`,
									className: "input flex-1"
								})]
							}, i))
						}),
						seed !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "num mt-3 rounded-md border border-border bg-chalk p-3 text-xs text-muted-foreground",
							children: [
								"Drawn with a Fisher-Yates shuffle from seed ",
								seed,
								". Re-run it as many times as your group wants — the seed is shown every time."
							]
						})
					] }),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "rounded-md border border-rust/40 bg-rust/10 p-3 text-sm text-rust",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90",
						children: "Create circle and get the invite link"
					})
				]
			}),
			invite && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 rounded-xl border border-brass/50 bg-chalk p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-xl font-semibold",
						children: [name, " is ready"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-muted-foreground",
						children: [
							"Send this link to the other ",
							members.length - 1,
							" people. Each one claims their seat in the order above."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "num mt-3 break-all rounded-md bg-parchment px-3 py-2.5 text-sm",
						children: invite
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/circle",
						className: "mt-4 inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90",
						children: "Open the circle"
					})
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "lg:sticky lg:top-24 lg:self-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roundtable, {
				seats,
				currentSeat: 0,
				size: 400,
				idle: false
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-6 space-y-3 rounded-xl border border-border bg-chalk p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Each person pays",
						v: `${Number(amount) || 0} XLM`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "How often",
						v: cadence.toLowerCase()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Pot per cycle",
						v: `${potPerCycle.toLocaleString("en-US")} XLM`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Full rotation",
						v: `${members.length} cycles`
					})
				]
			})]
		})]
	});
}
function Field({ label, htmlFor, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		htmlFor,
		className: "block text-sm font-medium",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1.5",
		children
	})] });
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-sm text-muted-foreground",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "num",
			children: v
		})]
	});
}
//#endregion
export { CreateCircle as component };
