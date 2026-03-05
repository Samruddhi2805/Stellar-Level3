import { formatXLM, shortenAddress } from "../lib/stellar";

interface ReceiverConfirmationModalProps {
  isOpen: boolean;
  recipient: string;
  amount: number;
  sender: string;
  onConfirm: () => Promise<void>;
  onReject: () => Promise<void>;
  isLoading?: boolean;
}

export default function ReceiverConfirmationModal({
  isOpen,
  recipient,
  amount,
  sender,
  onConfirm,
  onReject,
  isLoading = false,
}: ReceiverConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content receiver-confirmation-modal">
        <div className="modal-header">
          <div className="modal-icon">🔔</div>
          <h3 className="modal-title">Awaiting Receiver Confirmation</h3>
          <p className="modal-subtitle">
            Transaction signed by sender - waiting for receiver approval
          </p>
        </div>

        <div className="modal-body">
          <div className="transaction-details">
            <div className="detail-row">
              <span className="detail-label">From:</span>
              <span className="detail-value">{shortenAddress(sender)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">To:</span>
              <span className="detail-value">{shortenAddress(recipient)}</span>
            </div>
            <div className="detail-row amount-row">
              <span className="detail-label">Amount:</span>
              <span className="detail-value amount-value">{formatXLM(amount)} XLM</span>
            </div>
          </div>

          <div className="confirmation-message">
            <div className="message-icon">⚠️</div>
            <p>
              <strong>{shortenAddress(recipient)}</strong> must confirm this 
              transaction. The payment will only proceed if they accept.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-reject"
            onClick={() => onReject().catch(() => {})}
            disabled={isLoading}
          >
            ❌ Reject
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner-sm"></div>
                Processing...
              </>
            ) : (
              <>
                ✅ Accept Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
