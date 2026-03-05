import type { ContractState } from "../lib/stellar";
import { formatXLM } from "../lib/stellar";
import { CONTRACT_ID } from "../lib/stellar";

interface ContractStatsCardProps {
    state: ContractState;
    loading: boolean;
    fromCache?: boolean;
}

export default function ContractStatsCard({
    state,
    loading,
    fromCache = false,
}: ContractStatsCardProps) {
    return (
        <div className="glass-card stats-card">
            <div className="shimmer-top" />
            <div className="stats-card-title">
                <span>📊 Contract Stats</span>
                {fromCache && <span className="cache-badge">⚡ Cached</span>}
                {loading && <span className="spinner-sm" style={{ marginLeft: "auto" }} />}
            </div>

            <div className="stats-grid">
                <div className="stat-box">
                    <p className="stat-value">
                        {loading ? "—" : formatXLM(state.totalVolume)}
                    </p>
                    <p className="stat-label">Total Volume (XLM)</p>
                </div>
                <div className="stat-box">
                    <p className="stat-value">
                        {loading ? "—" : state.totalPayments}
                    </p>
                    <p className="stat-label">Total Payments</p>
                </div>
            </div>

            <div className="contract-id-row">
                <span className="contract-id-label">Contract</span>
                <span className="contract-id-value" title={CONTRACT_ID}>
                    {CONTRACT_ID}
                </span>
                <a
                    href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--teal)", fontSize: "11px", flexShrink: 0, textDecoration: "none" }}
                    title="View on Stellar Explorer"
                >
                    ↗
                </a>
            </div>
        </div>
    );
}
