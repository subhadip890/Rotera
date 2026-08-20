import { Link } from "@tanstack/react-router";
import { WalletButton } from "@/components/wallet/WalletButton";
import { truncate } from "@/lib/rotera";

const CONTRACT_ID =
  import.meta.env.VITE_SOROBAN_CONTRACT_ID ||
  "CAY3GCWDFCXPU6JEIJAECX5UXWKXSKO5WTAV3QUFXFXRV4USNQ2FKLO4";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-parchment/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block size-5 rounded-full border-2 border-verdigris"
            style={{ boxShadow: "inset 0 0 0 2px #C9973C" }}
          />
          <span className="font-display text-lg font-semibold tracking-tight">Rotera</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-6 text-sm sm:flex">
          <Link
            to="/circle"
            className="text-muted-foreground transition-colors duration-200 hover:text-ink"
            activeProps={{ className: "text-ink font-medium" }}
          >
            My circle
          </Link>
          <Link
            to="/history"
            className="text-muted-foreground transition-colors duration-200 hover:text-ink"
            activeProps={{ className: "text-ink font-medium" }}
          >
            History
          </Link>
          <Link
            to="/create"
            className="text-muted-foreground transition-colors duration-200 hover:text-ink"
            activeProps={{ className: "text-ink font-medium" }}
          >
            Start a circle
          </Link>
        </nav>
        <div className="ml-auto sm:ml-0">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const displayContract = CONTRACT_ID.length > 10 ? truncate(CONTRACT_ID) : CONTRACT_ID;

  return (
    <footer className="mt-20 border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-20 pt-8 text-sm sm:pb-8 sm:pr-32 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Rotera — savings circles that run themselves.</p>
        <p className="num text-xs">Stellar testnet · contract {displayContract}</p>
      </div>
    </footer>
  );
}
