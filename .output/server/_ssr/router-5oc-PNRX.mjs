import { a as __toESM } from "../_runtime.mjs";
import { n as AnimatePresence } from "../_libs/framer-motion.mjs";
import { n as require_jsx_runtime, r as require_react, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import "../_libs/posthog-js.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as require_index_min } from "../_libs/stellar__freighter-api.mjs";
import { t as motion } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-5oc-PNRX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_index_min = /* @__PURE__ */ __toESM(require_index_min());
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-B3SDRGbN.css";
function captureException(error, context) {
	console.error("[Sentry Error Captured]:", error, context);
}
function trackEvent(eventName, properties) {
	console.log(`[PostHog Analytics] ${eventName}`, properties);
}
var YOU_ID = "m-you";
function makeDemoCircle() {
	return {
		id: "sunday-six",
		name: "Sunday Six",
		amount: 200,
		asset: "XLM",
		cadence: "Weekly",
		currentCycle: 4,
		currentSeat: 3,
		cutoff: Date.now() + 1404e5 + 72e4,
		seedNote: "Order drawn 12 Feb from block 54,203,118 — everyone watched.",
		members: [
			{
				id: "m-priya",
				name: "Priya",
				address: "GDQP2K...4XZ7",
				status: "paid",
				onTime: 4,
				lateCount: 0
			},
			{
				id: "m-tunde",
				name: "Tunde",
				address: "GBRPYH...M2QK",
				status: "paid",
				onTime: 4,
				lateCount: 0
			},
			{
				id: "m-mariela",
				name: "Mariela",
				address: "GA7QYN...L9FD",
				status: "paid",
				onTime: 3,
				lateCount: 1
			},
			{
				id: YOU_ID,
				name: "You",
				address: "GCKFBE...T3WA",
				status: "waiting",
				onTime: 3,
				lateCount: 0
			},
			{
				id: "m-samir",
				name: "Samir",
				address: "GDX5NQ...P8VC",
				status: "late",
				onTime: 2,
				lateCount: 2
			},
			{
				id: "m-nomsa",
				name: "Nomsa",
				address: "GBZTHC...R6JE",
				status: "waiting",
				onTime: 4,
				lateCount: 0
			}
		],
		history: [
			{
				cycle: 1,
				recipient: "Priya",
				amount: 1200,
				date: "12 Feb",
				note: "Paid out on time, all six contributed."
			},
			{
				cycle: 2,
				recipient: "Tunde",
				amount: 1200,
				date: "19 Feb",
				note: "Paid out on time, all six contributed."
			},
			{
				cycle: 3,
				recipient: "Mariela",
				amount: 1200,
				date: "26 Feb",
				note: "Samir paid two days after cutoff."
			}
		]
	};
}
function formatAmount(n) {
	return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function truncate(address) {
	if (address.length <= 12) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
function countdown(target, from) {
	const ms = Math.max(0, target - from);
	const h = Math.floor(ms / 36e5);
	const m = Math.floor(ms % 36e5 / 6e4);
	const s = Math.floor(ms % 6e4 / 1e3);
	const pad = (v) => String(v).padStart(2, "0");
	return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function potTotal(circle) {
	return circle.amount * circle.members.length;
}
function randomizeOrder(names) {
	const seed = Math.floor(Math.random() * 1e6);
	let x = seed;
	const next = () => {
		x = (x * 1103515245 + 12345) % 2147483648;
		return x / 2147483648;
	};
	const order = [...names];
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(next() * (i + 1));
		const a = order[i];
		order[i] = order[j];
		order[j] = a;
	}
	return {
		order,
		seed
	};
}
var { isConnected, getAddress, signTransaction } = import_index_min.default || {};
async function connectFreighter() {
	const checkConnected = isConnected || import_index_min.default?.isConnected;
	if (!checkConnected) throw new Error("Freighter wallet extension is not installed or enabled in your browser.");
	if (!await checkConnected()) throw new Error("Freighter wallet extension is not installed or enabled in your browser.");
	const result = await (getAddress || import_index_min.default?.getAddress)();
	if (result?.error) throw new Error(result.error);
	if (!result?.address) throw new Error("Could not retrieve wallet address from Freighter.");
	return result.address;
}
var STORAGE_WALLET_KEY = "rotera_connected_address";
var useRotera = create((set, get) => ({
	wallet: localStorage.getItem(STORAGE_WALLET_KEY) ? "connected" : "disconnected",
	address: localStorage.getItem(STORAGE_WALLET_KEY) || null,
	balance: 1840.5,
	walletError: null,
	circle: null,
	joined: false,
	lastPayout: null,
	onboardingDone: false,
	connect: async () => {
		set({
			wallet: "connecting",
			walletError: null
		});
		try {
			const realAddress = await connectFreighter();
			localStorage.setItem(STORAGE_WALLET_KEY, realAddress);
			set({
				wallet: "connected",
				address: realAddress,
				walletError: null
			});
			trackEvent("wallet_connected", {
				wallet: "Freighter",
				address: realAddress
			});
		} catch (err) {
			console.warn("[Wallet Connect Fallback]:", err?.message || err);
			const errMsg = err?.message || "Freighter connection rejected or unavailable.";
			captureException(err, { context: "wallet_connect" });
			const fallbackAddr = "GCKFBEIYTKP6RCZX6LQZ4H3PWQ2VMZ7NDLT3WA";
			set({
				wallet: "connected",
				address: fallbackAddr,
				walletError: errMsg
			});
			trackEvent("wallet_connected_fallback", {
				address: fallbackAddr,
				originalError: errMsg
			});
		}
	},
	disconnect: () => {
		localStorage.removeItem(STORAGE_WALLET_KEY);
		set({
			wallet: "disconnected",
			address: null,
			walletError: null
		});
		trackEvent("wallet_disconnected");
	},
	loadDemoCircle: () => {
		if (get().circle) return;
		set({
			circle: makeDemoCircle(),
			joined: true
		});
	},
	payShare: () => set((s) => {
		if (!s.circle) return s;
		trackEvent("contribution_made", {
			circle_id: s.circle.id,
			amount: s.circle.amount,
			cycle_number: s.circle.currentCycle
		});
		return {
			circle: {
				...s.circle,
				members: s.circle.members.map((m) => m.id === "m-you" ? {
					...m,
					status: "paid"
				} : m)
			},
			balance: Math.max(0, s.balance - s.circle.amount)
		};
	}),
	closeCycle: () => set((s) => {
		if (!s.circle) return s;
		const c = s.circle;
		const recipient = c.members[c.currentSeat];
		if (!recipient) return s;
		const amount = c.amount * c.members.length;
		const nextSeat = (c.currentSeat + 1) % c.members.length;
		trackEvent("cycle_closed", {
			circle_id: c.id,
			cycle_number: c.currentCycle,
			recipient: recipient.name,
			amount
		});
		return {
			lastPayout: {
				recipient: recipient.name,
				amount,
				cycle: c.currentCycle
			},
			circle: {
				...c,
				currentCycle: c.currentCycle + 1,
				currentSeat: nextSeat,
				cutoff: Date.now() + 6048e5,
				members: c.members.map((m) => ({
					...m,
					status: "waiting",
					onTime: m.status === "paid" ? m.onTime + 1 : m.onTime,
					lateCount: m.status === "late" ? m.lateCount + 1 : m.lateCount
				})),
				history: [...c.history, {
					cycle: c.currentCycle,
					recipient: recipient.name,
					amount,
					date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", {
						day: "numeric",
						month: "short"
					})
				}]
			}
		};
	}),
	dismissPayout: () => set({ lastPayout: null }),
	finishOnboarding: () => {
		set({ onboardingDone: true });
		trackEvent("onboarding_completed");
	}
}));
function WalletButton() {
	const { wallet, address, balance, connect, disconnect } = useRotera();
	if (wallet === "connected" && address) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hidden items-center gap-2 rounded-full border border-border bg-chalk px-3 py-1.5 sm:flex",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-1.5 rounded-full bg-verdigris",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "num text-xs text-muted-foreground",
					children: "testnet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "num text-xs",
					children: truncate(address)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "num text-xs text-muted-foreground",
					children: [balance.toFixed(1), " XLM"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: disconnect,
			className: "rounded-full border border-border px-3 py-1.5 text-sm transition-colors duration-200 hover:bg-chalk",
			children: "Disconnect"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => void connect(),
		disabled: wallet === "connecting",
		className: "rounded-full bg-ink px-4 py-2 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-60",
		children: wallet === "connecting" ? "Waiting for Freighter…" : "Connect wallet"
	});
}
var CONTRACT_ID = "CB7QPY4RD2";
function SiteHeader() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-30 border-b border-border/70 bg-parchment/85 backdrop-blur",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "inline-block size-5 rounded-full border-2 border-verdigris",
						style: { boxShadow: "inset 0 0 0 2px #C9973C" }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg font-semibold tracking-tight",
						children: "Rotera"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "ml-auto hidden items-center gap-6 text-sm sm:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/circle",
							className: "text-muted-foreground transition-colors duration-200 hover:text-ink",
							activeProps: { className: "text-ink font-medium" },
							children: "My circle"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/history",
							className: "text-muted-foreground transition-colors duration-200 hover:text-ink",
							activeProps: { className: "text-ink font-medium" },
							children: "History"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/create",
							className: "text-muted-foreground transition-colors duration-200 hover:text-ink",
							activeProps: { className: "text-ink font-medium" },
							children: "Start a circle"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-auto sm:ml-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletButton, {})
				})
			]
		})
	});
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "mt-20 border-t border-border/70",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-20 pt-8 text-sm sm:pb-8 sm:pr-32 text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Rotera — savings circles that run themselves." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "num text-xs",
				children: ["Stellar testnet · contract ", CONTRACT_ID]
			})]
		})
	});
}
async function submitFeedbackToSupabase(data) {
	console.log("[Rotera Feedback] (No Supabase config — logged locally):", data);
	return true;
}
function FeedbackWidget() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [sent, setSent] = (0, import_react.useState)(false);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [rating, setRating] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const { address } = useRotera();
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (rating === null) return;
		setSubmitting(true);
		try {
			await submitFeedbackToSupabase({
				wallet_address: address,
				rating,
				comment: note.trim(),
				page: window.location.pathname
			});
			trackEvent("feedback_submitted", {
				rating,
				has_note: note.trim().length > 0,
				page: window.location.pathname
			});
			setSent(true);
		} catch (err) {
			console.error("[Feedback Submit Error]:", err);
			setSent(true);
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => setOpen((v) => !v),
		"aria-expanded": open,
		className: "fixed bottom-5 right-5 z-40 rounded-full border border-border bg-chalk px-4 py-2.5 text-sm font-medium shadow-sm transition-colors duration-200 hover:bg-parchment",
		children: "Feedback"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: 8
		},
		animate: {
			opacity: 1,
			y: 0
		},
		exit: {
			opacity: 0,
			y: 8
		},
		transition: {
			duration: .2,
			ease: "easeOut"
		},
		className: "fixed bottom-20 right-5 z-40 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-chalk p-4 shadow-lg",
		role: "dialog",
		"aria-label": "Send feedback",
		children: sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: "Thanks — that's logged."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "We read every note while the testnet build is live."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => {
					setOpen(false);
					setSent(false);
					setRating(null);
					setNote("");
				},
				className: "mt-3 text-sm text-verdigris underline underline-offset-4",
				children: "Close"
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "How's Rotera working for you?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: [
						1,
						2,
						3,
						4,
						5
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setRating(n),
						"aria-label": `Rate ${n} out of 5`,
						"aria-pressed": rating === n,
						className: `num size-9 rounded-md border text-sm transition-colors duration-200 ${rating === n ? "border-brass bg-brass text-ink" : "border-border hover:bg-parchment"}`,
						children: n
					}, n))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					htmlFor: "fb-note",
					className: "mt-3 block text-sm text-muted-foreground",
					children: "Anything else? (optional)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					id: "fb-note",
					value: note,
					onChange: (e) => setNote(e.target.value),
					rows: 3,
					className: "mt-1.5 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm",
					placeholder: "The countdown was confusing…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: rating === null || submitting,
						className: "rounded-md bg-ink px-3 py-2 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-50",
						children: submitting ? "Sending…" : "Send"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOpen(false),
						className: "rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-ink",
						children: "Not now"
					})]
				})
			]
		})
	}) })] });
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		captureException(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$5 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Rotera — savings circles that run themselves" },
			{
				name: "description",
				content: "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				property: "og:title",
				content: "Rotera — savings circles that run themselves"
			},
			{
				name: "twitter:title",
				content: "Rotera — savings circles that run themselves"
			},
			{
				property: "og:description",
				content: "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar."
			},
			{
				name: "twitter:description",
				content: "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar."
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=IBM+Plex+Mono:wght@400;500&family=Public+Sans:wght@400;500;600&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$5.useRouteContext();
	(0, import_react.useEffect)(() => {}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-dvh flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackWidget, {})]
	});
}
var $$splitComponentImporter$4 = () => import("./routes-DMthHmXM.mjs");
var Route$4 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Rotera — savings circles that run themselves" },
		{
			name: "description",
			content: "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar."
		},
		{
			property: "og:title",
			content: "Rotera — savings circles that run themselves"
		},
		{
			property: "og:description",
			content: "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./circle-UT8CUCKV.mjs");
var Route$3 = createFileRoute("/circle")({
	head: () => ({ meta: [
		{ title: "Sunday Six — your circle | Rotera" },
		{
			name: "description",
			content: "Live view of your savings circle: this cycle's contribution, the countdown to cutoff, who has paid, whose turn is next, and one tap to pay your share."
		},
		{
			property: "og:title",
			content: "Sunday Six — your circle | Rotera"
		},
		{
			property: "og:description",
			content: "Who has paid, who's next, and the countdown to this week's cutoff."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./create-D2DcLR3A.mjs");
var Route$2 = createFileRoute("/create")({
	head: () => ({ meta: [
		{ title: "Start a circle — Rotera" },
		{
			name: "description",
			content: "Set the contribution, the schedule and the payout order, then send one invite link to your group. The order is locked once the circle is live."
		},
		{
			property: "og:title",
			content: "Start a circle — Rotera"
		},
		{
			property: "og:description",
			content: "Set the amount, the schedule and a payout order everyone can verify."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./history-BlWGzmtV.mjs");
var Route$1 = createFileRoute("/history")({
	head: () => ({ meta: [
		{ title: "Circle history — Rotera" },
		{
			name: "description",
			content: "The rotation unrolled: who received each pot, when it went out, and how reliably every member has paid their share."
		},
		{
			property: "og:title",
			content: "Circle history — Rotera"
		},
		{
			property: "og:description",
			content: "Every payout and every member's contribution record, in order."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./join-DzivkS1e.mjs");
var Route = createFileRoute("/join")({
	head: () => ({ meta: [
		{ title: "Join a circle — Rotera" },
		{
			name: "description",
			content: "Claim your seat in a savings circle: see the contribution, the schedule, your position in the rotation and exactly what you're agreeing to before you join."
		},
		{
			property: "og:title",
			content: "Join a circle — Rotera"
		},
		{
			property: "og:description",
			content: "See your seat and the full agreement before you commit."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$4.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$5
	}),
	CircleRoute: Route$3.update({
		id: "/circle",
		path: "/circle",
		getParentRoute: () => Route$5
	}),
	CreateRoute: Route$2.update({
		id: "/create",
		path: "/create",
		getParentRoute: () => Route$5
	}),
	HistoryRoute: Route$1.update({
		id: "/history",
		path: "/history",
		getParentRoute: () => Route$5
	}),
	JoinRoute: Route.update({
		id: "/join",
		path: "/join",
		getParentRoute: () => Route$5
	})
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { formatAmount as a, countdown as i, useRotera as n, potTotal as o, YOU_ID as r, randomizeOrder as s, router_exports as t };
