import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatAmount, n as useRotera } from "./router-5oc-PNRX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/history-BlWGzmtV.js
var import_jsx_runtime = require_jsx_runtime();
function History() {
	const { circle, loadDemoCircle } = useRotera();
	if (!circle) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl px-5 py-20 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold",
				children: "Nothing to show yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted-foreground",
				children: "Once a circle has closed its first cycle, every payout shows up here in order."
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl px-5 py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "text-4xl font-semibold",
				children: [circle.name, " — the record"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 max-w-xl text-muted-foreground",
				children: ["The same ring, unrolled. ", circle.seedNote]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-10 flex gap-0 overflow-x-auto pb-2",
				children: circle.members.map((m, i) => {
					const done = i < circle.currentSeat;
					const current = i === circle.currentSeat;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-w-24 flex-1 flex-col items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex w-full items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-px flex-1 ${i === 0 ? "bg-transparent" : done || current ? "bg-verdigris" : "bg-border"}` }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-4 rounded-full border-2 ${current ? "border-brass bg-brass" : done ? "border-verdigris bg-verdigris" : "border-border bg-chalk"}` }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-px flex-1 ${i === circle.members.length - 1 ? "bg-transparent" : done ? "bg-verdigris" : "bg-border"}` })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "num mt-2 text-xs text-muted-foreground",
								children: ["Cycle ", i + 1]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-sm ${current ? "font-semibold" : ""}`,
								children: m.name
							})
						]
					}, m.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-14 text-2xl font-semibold",
				children: "Payouts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-chalk",
				children: circle.history.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "num w-16 text-sm text-muted-foreground",
							children: ["Cycle ", h.cycle]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: h.recipient
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "num ml-auto text-lg",
							children: [formatAmount(h.amount), " XLM"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "num w-16 text-right text-sm text-muted-foreground",
							children: h.date
						}),
						h.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "w-full text-sm text-muted-foreground",
							children: h.note
						})
					]
				}, h.cycle))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-14 text-2xl font-semibold",
				children: "Who pays on time"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "mt-4 w-full overflow-hidden rounded-xl border border-border bg-chalk text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border text-sm text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							className: "px-5 py-3 font-medium",
							children: "Member"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							className: "px-5 py-3 font-medium",
							children: "On time"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							className: "px-5 py-3 font-medium",
							children: "Late"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							scope: "col",
							className: "px-5 py-3 font-medium",
							children: "Wallet"
						})
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: circle.members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/60 last:border-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-5 py-3.5 font-medium",
							children: m.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "num px-5 py-3.5",
							children: m.onTime
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `num px-5 py-3.5 ${m.lateCount > 0 ? "text-rust" : "text-muted-foreground"}`,
							children: m.lateCount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "num px-5 py-3.5 text-sm text-muted-foreground",
							children: m.address
						})
					]
				}, m.id)) })]
			})
		]
	});
}
//#endregion
export { History as component };
