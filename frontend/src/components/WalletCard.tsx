import { useState } from "react";
import type { PaymentRecord } from "../lib/stellar";
import { formatXLM, shortenAddress, timeAgo, explorerTxUrl, fundTestnetAccount } from "../lib/stellar";

interface WalletCardProps {
    address: string;
    balance: number;
    txHistory: PaymentRecord[];
    onDisconnect: () => void;
    balanceFromCache?: boolean;
}

export default function WalletCard({
    address,
    balance,
    txHistory,
    onDisconnect,
    balanceFromCache = false,
}: WalletCardProps) {
    const [copied, setCopied] = useState(false);

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <div className="glass-card wallet-card">
            <div className="shimmer-top" />

            {/* Balance */}
            <p className="wallet-balance-label">
                XLM Balance
                {balanceFromCache && (
                    <span className="cache-badge" style={{ marginLeft: "8px" }}>⚡ Cached</span>
                )}
            </p>
            <p className="wallet-balance-value">{formatXLM(balance)}</p>
            <p className="wallet-balance-usd">≈ ${(balance * 0.11).toFixed(2)} USD</p>

            {/* Address */}
            <div className="wallet-addr-row">
                <span className="wallet-addr-label" title={address}>
                    {shortenAddress(address, 8)}
                </span>
                <button
                    className="copy-btn"
                    onClick={copyAddress}
                    title="Copy address"
                    aria-label="Copy wallet address"
                >
                    {copied ? "✓" : "📋"}
                </button>
            </div>

            {/* Actions */}
            <div className="wallet-actions">
                <button className="btn-action">
                    <a
                        href={fundTestnetAccount(address)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        💧 Fund Account
                    </a>
                </button>
                <button className="btn-action danger" onClick={onDisconnect}>
                    Disconnect
                </button>
            </div>

            {/* TX History */}
            <div className="tx-history-header">
                <span className="tx-history-title">Recent Transactions</span>
                <span className="tx-history-count">{txHistory.length} total</span>
            </div>

            <div className="tx-history-list">
                {txHistory.length === 0 ? (
                    <p className="tx-empty">No transactions yet</p>
                ) : (
                    txHistory.map((tx) => (
                        <TxItem key={tx.id} tx={tx} />
                    ))
                )}
            </div>
        </div>
    );
}

function TxItem({ tx }: { tx: PaymentRecord }) {
    const iconMap = {
        success: "✅",
        pending: "⏳",
        failed: "❌",
    };

    return (
        <div className="tx-item">
            <div className={`tx-status-icon ${tx.status}`}>
                {iconMap[tx.status]}
            </div>
            <div className="tx-info">
                <p className="tx-recipient" title={tx.recipient}>
                    → {shortenAddress(tx.recipient, 5)}
                </p>
                <p className="tx-time">
                    {timeAgo(tx.timestamp)}
                    {tx.txHash && (
                        <>
                            {" · "}
                            <a
                                href={explorerTxUrl(tx.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--teal)", textDecoration: "none", fontSize: "10px" }}
                            >
                                Explorer ↗
                            </a>
                        </>
                    )}
                </p>
            </div>
            <span className="tx-amount">-{formatXLM(tx.amount)} XLM</span>
        </div>
    );
}
