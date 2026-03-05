import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the wallet kit
vi.mock('../lib/walletKit', () => ({
  connectWallet: vi.fn(),
  signTransaction: vi.fn(),
  disconnectWallet: vi.fn(),
}));

// Mock the stellar functions
vi.mock('../lib/stellar', () => ({
  getXLMBalance: vi.fn(),
  readContractState: vi.fn(),
  updateContractState: vi.fn(),
  buildPaymentTx: vi.fn(),
  submitClassicTx: vi.fn(),
  submitTransaction: vi.fn(),
  InsufficientBalanceError: class extends Error {
    constructor(required: number, available: number) {
      super(`Insufficient XLM balance. Required: ${required}, Available: ${available.toFixed(2)}`);
      this.name = 'InsufficientBalanceError';
    }
  },
  isValidStellarAddress: vi.fn(),
  formatXLM: vi.fn(),
  timeAgo: vi.fn(),
  explorerTxUrl: vi.fn(),
}));

// Mock cache functions
vi.mock('../lib/cache', () => ({
  cacheWalletAddress: vi.fn(),
  getCachedWalletAddress: vi.fn(),
  clearCachedWalletAddress: vi.fn(),
  cacheBalance: vi.fn(),
  getCachedBalance: vi.fn(),
  cacheTransactions: vi.fn(),
  getCachedTransactions: vi.fn(),
  cacheContractState: vi.fn(),
  getCachedContractState: vi.fn(),
  clearAllCache: vi.fn(),
}));

import { connectWallet, signTransaction } from '../lib/walletKit';
import { 
  getXLMBalance, 
  readContractState, 
  updateContractState,
  buildPaymentTx, 
  submitClassicTx,
  InsufficientBalanceError 
} from '../lib/stellar';

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
    vi.mocked(signTransaction).mockResolvedValue('signed_xdr');
    vi.mocked(getXLMBalance).mockResolvedValue(1000);
    vi.mocked(readContractState).mockResolvedValue({ totalVolume: 5000, totalPayments: 25 });
    vi.mocked(buildPaymentTx).mockResolvedValue({ xdr: 'transaction_xdr', isClassic: true });
    vi.mocked(submitClassicTx).mockResolvedValue('transaction_hash');
    vi.mocked(updateContractState).mockImplementation(() => {});
  });

  describe('Wallet Connection Errors', () => {
    it('should handle wallet not found error', async () => {
      vi.mocked(connectWallet).mockRejectedValue(new Error('WalletNotFound:Freighter'));
      
      render(<App />);

      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Freighter wallet not found/)).toBeInTheDocument();
      });
    });

    it('should handle wallet connection rejection', async () => {
      vi.mocked(connectWallet).mockRejectedValue(new Error('TransactionRejected:'));
      
      render(<App />);

      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Transaction Rejected/)).toBeInTheDocument();
      });
    });

    it('should handle generic wallet connection error', async () => {
      vi.mocked(connectWallet).mockRejectedValue(new Error('Network error'));
      
      render(<App />);

      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Transaction Failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Signing Errors', () => {
    it('should handle transaction signing rejection', async () => {
      // First connect wallet successfully
      vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
      
      render(<App />);

      // Connect wallet first
      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
      });

      // Mock signing rejection
      vi.mocked(signTransaction).mockRejectedValue(new Error('TransactionRejected:'));

      // Fill form and try to send
      const recipientInput = screen.getByPlaceholderText('G...');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('🚀 Send XLM');

      fireEvent.change(recipientInput, { target: { value: 'GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Transaction Rejected/)).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Submission Errors', () => {
    it('should handle insufficient balance error', async () => {
      // Connect wallet successfully
      vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
      
      render(<App />);

      // Connect wallet
      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
      });

      // Mock insufficient balance error
      vi.mocked(submitClassicTx).mockRejectedValue(new InsufficientBalanceError(100, 50));

      // Fill form and try to send
      const recipientInput = screen.getByPlaceholderText('G...');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('🚀 Send XLM');

      fireEvent.change(recipientInput, { target: { value: 'GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q' } });
      fireEvent.change(amountInput, { target: { value: '100' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Insufficient Balance/)).toBeInTheDocument();
      });
    });

    it('should handle generic transaction submission error', async () => {
      // Connect wallet successfully
      vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
      
      render(<App />);

      // Connect wallet
      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
      });

      // Mock generic submission error
      vi.mocked(submitClassicTx).mockRejectedValue(new Error('Network timeout'));

      // Fill form and try to send
      const recipientInput = screen.getByPlaceholderText('G...');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('🚀 Send XLM');

      fireEvent.change(recipientInput, { target: { value: 'GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Transaction Failed/)).toBeInTheDocument();
        expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
      });
    });
  });

  describe('Contract State Errors', () => {
    it('should handle contract state loading errors gracefully', async () => {
      // Mock contract state error
      vi.mocked(readContractState).mockRejectedValue(new Error('Contract not deployed'));
      
      render(<App />);

      // Should still load the app without crashing
      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Errors', () => {
    it('should validate Stellar address format', async () => {
      // Connect wallet successfully
      vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
      
      render(<App />);

      // Connect wallet
      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
      });

      // Try invalid address
      const recipientInput = screen.getByPlaceholderText('G...');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('🚀 Send XLM');

      fireEvent.change(recipientInput, { target: { value: 'invalid_address' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Enter a valid Stellar address/)).toBeInTheDocument();
      });
    });

    it('should validate amount is greater than 0', async () => {
      // Connect wallet successfully
      vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
      
      render(<App />);

      // Connect wallet
      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
      });

      // Try zero amount
      const recipientInput = screen.getByPlaceholderText('G...');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('🚀 Send XLM');

      fireEvent.change(recipientInput, { target: { value: 'GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q' } });
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Enter a valid amount greater than 0/)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Transaction Flow', () => {
    it('should handle successful transaction flow', async () => {
      // Connect wallet successfully
      vi.mocked(connectWallet).mockResolvedValue('GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q');
      
      render(<App />);

      // Connect wallet
      const connectButton = screen.getByText('⚡ Connect Freighter');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect/)).toBeInTheDocument();
      });

      // Fill form and send successfully
      const recipientInput = screen.getByPlaceholderText('G...');
      const amountInput = screen.getByPlaceholderText('0.00');
      const sendButton = screen.getByText('🚀 Send XLM');

      fireEvent.change(recipientInput, { target: { value: 'GD5DJQD6KXQWRQ2QY4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Payment Sent!/)).toBeInTheDocument();
      });

      // Verify contract state was updated
      expect(vi.mocked(updateContractState)).toHaveBeenCalledWith(10);
    });
  });
});
