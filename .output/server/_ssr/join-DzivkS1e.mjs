import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useRotera } from "./router-5oc-PNRX.mjs";
import { t as Roundtable } from "./Roundtable-C29LH-cO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/join-DzivkS1e.js
var import_jsx_runtime = require_jsx_runtime();
var SEATS = [
	{
		id: "1",
		name: "Priya",
		status: "waiting"
	},
	{
		id: "2",
		name: "Tunde",
		status: "waiting"
	},
	{
		id: "3",
		name: "Mariela",
		status: "waiting"
	},
	{
		id: "4",
		name: "You",
		status: "waiting"
	},
	{
		id: "5",
		name: "Samir",
		status: "waiting"
	},
	{
		id: "6",
		name: "Nomsa",
		status: "waiting"
	}
];
function JoinCircle() {
	const navigate = useNavigate();
	const { wallet, connect, loadDemoCircle } = useRotera();
	const connected = wallet === "connected";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid max-w-5xl gap-12 px-5 py-12 lg:grid-cols-[1fr_380px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "num text-xs uppercase tracking-[0.18em] text-verdigris",
				children: "Invite · sunday-six-4f2a"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 text-4xl font-semibold",
				children: "Priya invited you to Sunday Six"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-muted-foreground",
				children: "Six people, six weeks, one turn each. Read the agreement below — after you join, none of it can change."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-10 text-xl font-semibold",
				children: "What you're agreeing to"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-3",
				children: [
					"You pay 200 XLM every Sunday before 8pm, for six weeks.",
					"You are seat 4. You receive the full pot of 1,200 XLM in week 4.",
					"If you pay after the cutoff, the circle records it as late and everyone sees it.",
					"You can't leave once the first payout has gone out — your seat stays in the rotation."
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "mt-2 size-1.5 shrink-0 rounded-full bg-verdigris"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: t
					})]
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 rounded-xl border border-border bg-chalk p-5",
				children: connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: "Wallet connected — seat 4 is held for you."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Joining costs nothing. Your first 200 XLM is due at the next cutoff."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							loadDemoCircle();
							navigate({ to: "/circle" });
						},
						className: "mt-4 rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90",
						children: "Take seat 4"
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: "Connect a wallet to claim your seat"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Freighter, Albedo and xBull all work. Nothing leaves your wallet until you approve a payment."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => void connect(),
						disabled: wallet === "connecting",
						className: "mt-4 rounded-md bg-ink px-6 py-3.5 font-semibold text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-60",
						children: wallet === "connecting" ? "Waiting for Freighter…" : "Connect wallet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: [
							"No wallet yet?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "text-verdigris underline underline-offset-4",
								children: "Read how wallets work first"
							}),
							"."
						]
					})
				] })
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "lg:sticky lg:top-24 lg:self-start",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roundtable, {
				seats: SEATS,
				currentSeat: 3,
				size: 380,
				caption: "Your seat is highlighted in brass"
			})
		})]
	});
}
//#endregion
export { JoinCircle as component };
