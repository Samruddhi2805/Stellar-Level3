import type { PaymentRecord, ContractState } from "./stellar";

const CACHE_KEYS = {
    WALLET_ADDRESS: "stellar_dapp_wallet_address",
    BALANCE: "stellar_dapp_balance",
    TRANSACTIONS: "stellar_dapp_transactions",
    CONTRACT_STATE: "stellar_dapp_contract_state",
} as const;

// ── Wallet Address ────────────────────────────────────────────────────────────
export function cacheWalletAddress(address: string): void {
    try {
        localStorage.setItem(CACHE_KEYS.WALLET_ADDRESS, address);
    } catch { /* storage unavailable */ }
}

export function getCachedWalletAddress(): string | null {
    try {
        return localStorage.getItem(CACHE_KEYS.WALLET_ADDRESS);
    } catch {
        return null;
    }
}

export function clearCachedWalletAddress(): void {
    try {
        localStorage.removeItem(CACHE_KEYS.WALLET_ADDRESS);
    } catch { /* ignore */ }
}

// ── Balance ───────────────────────────────────────────────────────────────────
export function cacheBalance(balance: number): void {
    try {
        localStorage.setItem(CACHE_KEYS.BALANCE, String(balance));
    } catch { /* ignore */ }
}

export function getCachedBalance(): number | null {
    try {
        const raw = localStorage.getItem(CACHE_KEYS.BALANCE);
        if (raw === null) return null;
        const parsed = parseFloat(raw);
        return isNaN(parsed) ? null : parsed;
    } catch {
        return null;
    }
}

// ── Transactions ──────────────────────────────────────────────────────────────
export function cacheTransactions(txs: PaymentRecord[]): void {
    try {
        // Keep the most recent 20 transactions
        const toCache = txs.slice(0, 20);
        localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(toCache));
    } catch { /* ignore */ }
}

export function getCachedTransactions(): PaymentRecord[] {
    try {
        const raw = localStorage.getItem(CACHE_KEYS.TRANSACTIONS);
        if (!raw) return [];
        return JSON.parse(raw) as PaymentRecord[];
    } catch {
        return [];
    }
}

// ── Contract State ────────────────────────────────────────────────────────────
export function cacheContractState(state: ContractState): void {
    try {
        localStorage.setItem(CACHE_KEYS.CONTRACT_STATE, JSON.stringify(state));
    } catch { /* ignore */ }
}

export function getCachedContractState(): ContractState | null {
    try {
        const raw = localStorage.getItem(CACHE_KEYS.CONTRACT_STATE);
        if (!raw) return null;
        return JSON.parse(raw) as ContractState;
    } catch {
        return null;
    }
}

// ── Clear All ─────────────────────────────────────────────────────────────────
export function clearAllCache(): void {
    try {
        Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch { /* ignore */ }
}
