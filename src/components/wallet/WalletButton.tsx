import { useRotera } from "@/store/useRotera";
import { truncate } from "@/lib/rotera";

export function WalletButton() {
  const { wallet, address, balance, connect, disconnect } = useRotera();

  if (wallet === "connected" && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-chalk px-3 py-1.5 sm:flex">
          <span className="size-1.5 rounded-full bg-verdigris" aria-hidden />
          <span className="num text-xs text-muted-foreground">testnet</span>
          <span className="num text-xs">{truncate(address)}</span>
          <span className="num text-xs text-muted-foreground">
            {balance.toFixed(1)} XLM
          </span>
        </div>
        <button
          onClick={disconnect}
          className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors duration-200 hover:bg-chalk"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => void connect()}
      disabled={wallet === "connecting"}
      className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
    >
      {wallet === "connecting" ? "Waiting for Freighter…" : "Connect wallet"}
    </button>
  );
}
