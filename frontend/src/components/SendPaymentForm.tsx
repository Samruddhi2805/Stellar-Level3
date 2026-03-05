import { useState, useCallback } from "react";
import { formatXLM, isValidStellarAddress, explorerTxUrl } from "../lib/stellar";

export type TxStatus = "idle" | "pending" | "success" | "error";

export interface TxRecord {
    status: TxStatus;
    hash?: string;
    error?: string;
    step?: string;
}

interface SendPaymentFormProps {
    address: string;
    balance: number;
    txRecord: TxRecord;
    onSend: (recipient: string, amount: number) => Promise<void>;
    fromCache?: boolean;
}

const QUICK_AMOUNTS = [10, 50, 100, 250];
const MIN_RESERVE = 1.5; // Stellar minimum reserve

export default function SendPaymentForm({
    address,
    balance,
    txRecord,
    onSend,
    fromCache = false,
}: SendPaymentFormProps) {
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [recipientError, setRecipientError] = useState("");
    const [amountError, setAmountError] = useState("");

    const isSending = txRecord.status === "pending";

    const validateAndSend = useCallback(async () => {
        setRecipientError("");
        setAmountError("");

        let valid = true;

        if (!isValidStellarAddress(recipient)) {
            setRecipientError("Enter a valid Stellar address (starts with G, 56 chars)");
            valid = false;
        } else if (recipient === address) {
            setRecipientError("Cannot send XLM to yourself");
            valid = false;
        }

        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            setAmountError("Enter a valid amount greater than 0");
            valid = false;
        } else if (parsedAmount + MIN_RESERVE > balance) {
            setAmountError(
                `Insufficient balance. Available: ${formatXLM(Math.max(0, balance - MIN_RESERVE))} XLM (${MIN_RESERVE} XLM reserved)`
            );
            valid = false;
        }

        if (!valid) return;
        
        // Start the normal send process
        await onSend(recipient, parsedAmount);
        
        // Clear form on success
        if (txRecord.status !== "error") {
            setRecipient("");
            setAmount("");
        }
    }, [recipient, amount, address, balance, onSend, txRecord.status]);

    return (
        <div className="glass-card payment-card">
            <div className="shimmer-top" />
            <div className="corner-glow" />

            <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 className="card-title">Send XLM Payment</h2>
                    {fromCache && (
                        <span className="cache-badge">⚡ Cached</span>
                    )}
                </div>
                <p className="card-subtitle">
                    Instant transfer on Stellar Testnet — verified on-chain
                </p>
            </div>

            {/* Recipient Field */}
            <div className="input-group">
                <label htmlFor="recipient-input" className="field-label">Recipient Address</label>
                <input
                    id="recipient-input"
                    type="text"
                    className={`text-input${recipientError ? " error-border" : ""}`}
                    placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={recipient}
                    onChange={(e) => {
                        setRecipient(e.target.value.trim());
                        if (recipientError) setRecipientError("");
                    }}
                    disabled={isSending}
                    spellCheck={false}
                    autoComplete="off"
                />
                {recipientError && (
                    <p style={{ color: "#f87171", fontSize: "11px", marginTop: "6px" }}>
                        ⚠ {recipientError}
                    </p>
                )}
            </div>

            {/* Amount Field */}
            <div className="input-group">
                <label htmlFor="amount-input" className="field-label">Amount</label>
                <div className="amount-wrap">
                    <input
                        id="amount-input"
                        type="number"
                        className="amount-input"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            if (amountError) setAmountError("");
                        }}
                        disabled={isSending}
                        min="0.0000001"
                        step="0.01"
                    />
                    <span className="amount-currency-badge">XLM</span>
                </div>
                {amountError && (
                    <p style={{ color: "#f87171", fontSize: "11px", marginTop: "6px" }}>
                        ⚠ {amountError}
                    </p>
                )}
            </div>

            {/* Quick Amounts */}
            <div className="quick-amounts">
                {QUICK_AMOUNTS.map((q) => (
                    <button
                        key={q}
                        className="quick-btn"
                        onClick={() => {
                            setAmount(String(q));
                            if (amountError) setAmountError("");
                        }}
                        disabled={isSending}
                    >
                        {q} XLM
                    </button>
                ))}
            </div>

            {/* Balance Hint */}
            <p className="balance-hint">
                Available balance:{" "}
                <span>{formatXLM(Math.max(0, balance - MIN_RESERVE))} XLM</span>
                <span style={{ color: "rgba(240,244,255,0.3)" }}> (1.5 XLM reserved)</span>
            </p>

            {/* Send Button */}
            <button
                id="send-btn"
                className="btn-send"
                onClick={validateAndSend}
                disabled={isSending || !recipient || !amount}
            >
                {isSending ? (
                    <>
                        <span className="spinner-sm" style={{ borderTopColor: "var(--teal)" }} />
                        Transaction Pending…
                    </>
                ) : (
                    <>🚀 Send XLM</>
                )}
            </button>

            {/* Progress Steps (while pending) */}
            {isSending && txRecord.step && (
                <div style={{ marginTop: "14px" }}>
                    <div className="progress-steps">
                        <div className={`step-dot ${['signing', 'submitting', 'confirming'].includes(txRecord.step || '') ? 'done' : 'active'}`} />
                        <div className="step-line" />
                        <div className={`step-dot ${txRecord.step === 'submitting' || txRecord.step === 'confirming' ? 'active' : txRecord.step === 'done' ? 'done' : ''}`} />
                        <div className="step-line" />
                        <div className={`step-dot ${txRecord.step === 'confirming' ? 'active' : ''}`} />
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--white-dim)", marginTop: "8px", textAlign: "center" }}>
                        {txRecord.step === "signing" && "Waiting for wallet signature…"}
                        {txRecord.step === "submitting" && "Submitting to Stellar network…"}
                        {txRecord.step === "confirming" && "Confirming on-chain…"}
                    </p>
                </div>
            )}

            {/* TX Status */}
            {txRecord.status === "success" && txRecord.hash && (
                <div className="tx-status-bar success">
                    <span>✅</span>
                    <div>
                        Payment confirmed!{" "}
                        <a
                            className="tx-hash-link"
                            href={explorerTxUrl(txRecord.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {txRecord.hash.slice(0, 12)}…{txRecord.hash.slice(-8)}
                        </a>
                    </div>
                </div>
            )}

            {txRecord.status === "error" && txRecord.error && (
                <div className="tx-status-bar error">
                    <span>❌</span>
                    <span>{txRecord.error}</span>
                </div>
            )}
        </div>
    );
}
