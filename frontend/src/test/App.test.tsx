import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@creit.tech/stellar-wallets-kit", () => ({
    StellarWalletsKit: {
        init: vi.fn(),
        authModal: vi.fn().mockRejectedValue(new Error("not installed")),
        signTransaction: vi.fn(),
        disconnect: vi.fn(),
    },
    Networks: { TESTNET: "Test SDF Network ; September 2015" },
    FreighterModule: vi.fn(),
}));

vi.mock("@creit.tech/stellar-wallets-kit/modules/freighter", () => ({
    FreighterModule: vi.fn(),
}));

vi.mock("../lib/walletKit", () => ({
    connectWallet: vi.fn(),
    signTransaction: vi.fn(),
    disconnectWallet: vi.fn(),
}));

vi.mock("../lib/stellar", async () => {
    const real = await vi.importActual("../lib/stellar");
    return {
        ...real,
        getXLMBalance: vi.fn().mockResolvedValue(500),
        readContractState: vi.fn().mockResolvedValue({ totalVolume: 0, totalPayments: 0 }),
        buildPaymentTx: vi.fn(),
        submitClassicTx: vi.fn(),
        submitTransaction: vi.fn(),
    };
});

// ── Import components AFTER mocks ────────────────────────────────────────────
import App from "../App";
import HeroCard from "../components/HeroCard";
import SendPaymentForm from "../components/SendPaymentForm";
import WalletCard from "../components/WalletCard";
import ContractStatsCard from "../components/ContractStatsCard";
import ErrorToast from "../components/ErrorToast";
import { isValidStellarAddress, formatXLM, shortenAddress, timeAgo } from "../lib/stellar";

// ── Valid 56-char Stellar addresses (verified: length=56, starts with G, base32) ──
// Both pass isValidStellarAddress() — confirmed with node
const ADDR_A = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGYWDHEABDKPAGF5XL65YDR"; // 56 ✓
const ADDR_B = "GCFXHS4GXL6BVUCGBWDFX3GKWQIUPHZMOAYENOFLMUQPQW3GHYG64XX6"; // 56 ✓

// ════════════════════════════════════════════════════════════════════════════
// TEST 1 – App renders HeroCard when not connected
// ════════════════════════════════════════════════════════════════════════════
describe("Test 1 – App renders HeroCard when not connected", () => {
    it("shows the h1 heading and Connect Freighter button", () => {
        render(<App />);
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
        const btn = screen.getByRole("button", { name: /connect freighter/i });
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();
    });

    it("shows STELLAR TESTNET eyebrow text", () => {
        render(<App />);
        const matches = screen.getAllByText(/stellar testnet/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 2 – HeroCard loading / idle states
// ════════════════════════════════════════════════════════════════════════════
describe("Test 2 – HeroCard loading state", () => {
    it("disables button and shows spinner when loading=true", () => {
        render(<HeroCard onConnect={vi.fn()} loading={true} />);
        const btn = screen.getByRole("button", { name: /connecting/i });
        expect(btn).toBeDisabled();
        expect(document.querySelector(".spinner-sm")).toBeInTheDocument();
    });

    it("enables button and shows correct label when loading=false", () => {
        render(<HeroCard onConnect={vi.fn()} loading={false} />);
        const btn = screen.getByRole("button", { name: /connect freighter/i });
        expect(btn).not.toBeDisabled();
    });

    it("calls onConnect when button is clicked", () => {
        const onConnect = vi.fn();
        render(<HeroCard onConnect={onConnect} loading={false} />);
        fireEvent.click(screen.getByRole("button", { name: /connect freighter/i }));
        expect(onConnect).toHaveBeenCalledOnce();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 3 – Insufficient balance validation in SendPaymentForm
// ════════════════════════════════════════════════════════════════════════════
describe("Test 3 – Insufficient balance validation", () => {
    it("shows error when amount exceeds spendable balance (balance=2, MIN_RESERVE=1.5)", async () => {
        const user = userEvent.setup();
        const mockSend = vi.fn();

        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={2}
                txRecord={{ status: "idle" }}
                onSend={mockSend}
            />
        );

        const recipientInput = screen.getByPlaceholderText(/GXXX/i);
        const amountInput = screen.getByPlaceholderText("0.00");
        
        await user.clear(recipientInput);
        await user.type(recipientInput, ADDR_B);
        await user.clear(amountInput);
        await user.type(amountInput, "5");
        
        fireEvent.click(screen.getByRole("button", { name: /send xlm/i }));

        // Check for error message immediately
        expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("calls onSend when amount is within spendable balance", async () => {
        const user = userEvent.setup();
        const mockSend = vi.fn().mockResolvedValue(undefined);

        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "idle" }}
                onSend={mockSend}
            />
        );

        const recipientInput = screen.getByPlaceholderText(/GXXX/i);
        const amountInput = screen.getByPlaceholderText("0.00");
        
        await user.clear(recipientInput);
        await user.type(recipientInput, ADDR_B);
        await user.clear(amountInput);
        await user.type(amountInput, "10");
        
        fireEvent.click(screen.getByRole("button", { name: /send xlm/i }));

        await waitFor(() => {
            expect(mockSend).toHaveBeenCalledWith(ADDR_B, 10);
        }, { timeout: 1000 });
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 4 – Recipient address validation in SendPaymentForm
// ════════════════════════════════════════════════════════════════════════════
describe("Test 4 – Recipient address validation", () => {
    const mockSend = vi.fn();
    beforeEach(() => mockSend.mockClear());

    it("shows error for a clearly invalid address (too short)", async () => {
        const user = userEvent.setup();
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "idle" }}
                onSend={mockSend}
            />
        );

        await user.type(screen.getByPlaceholderText(/GXXX/i), "INVALID");
        await user.type(screen.getByPlaceholderText("0.00"), "10");
        fireEvent.click(screen.getByRole("button", { name: /send xlm/i }));

        await waitFor(() => {
            expect(screen.getByText(/valid stellar address/i)).toBeInTheDocument();
        });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("shows error when sending XLM to your own address", async () => {
        const user = userEvent.setup();
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "idle" }}
                onSend={mockSend}
            />
        );
        // Recipient = same as sender
        await user.type(screen.getByPlaceholderText(/GXXX/i), ADDR_A);
        await user.type(screen.getByPlaceholderText("0.00"), "10");
        fireEvent.click(screen.getByRole("button", { name: /send xlm/i }));

        await waitFor(() => {
            expect(screen.getByText(/cannot send xlm to yourself/i)).toBeInTheDocument();
        });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("shows error when amount is zero", async () => {
        const user = userEvent.setup();
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "idle" }}
                onSend={mockSend}
            />
        );

        await user.type(screen.getByPlaceholderText(/GXXX/i), ADDR_B);
        await user.type(screen.getByPlaceholderText("0.00"), "0");
        fireEvent.click(screen.getByRole("button", { name: /send xlm/i }));

        await waitFor(() => {
            expect(screen.getByText(/valid amount greater than 0/i)).toBeInTheDocument();
        });
        expect(mockSend).not.toHaveBeenCalled();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 5 – Transaction state display in SendPaymentForm
// ════════════════════════════════════════════════════════════════════════════
describe("Test 5 – SendPaymentForm transaction states", () => {
    it("disables inputs and shows spinner while pending", () => {
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "pending", step: "signing" }}
                onSend={vi.fn()}
            />
        );
        expect(screen.getByRole("button", { name: /transaction pending/i })).toBeDisabled();
        expect(screen.getByPlaceholderText(/GXXX/i)).toBeDisabled();
        expect(document.querySelector(".spinner-sm")).toBeInTheDocument();
    });

    it("shows 'Waiting for wallet signature' when step=signing", () => {
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "pending", step: "signing" }}
                onSend={vi.fn()}
            />
        );
        expect(screen.getByText(/waiting for wallet signature/i)).toBeInTheDocument();
    });

    it("shows success bar with explorer link on success", () => {
        const hash = "a1b2c3d4e5f6a1b2c3d4e5f6deadbeef";
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "success", hash }}
                onSend={vi.fn()}
            />
        );
        expect(screen.getByText(/payment confirmed/i)).toBeInTheDocument();
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", expect.stringContaining(hash));
    });

    it("shows error bar when transaction fails", () => {
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "error", error: "Network timeout occurred" }}
                onSend={vi.fn()}
            />
        );
        expect(screen.getByText(/network timeout occurred/i)).toBeInTheDocument();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 6 – WalletCard component
// ════════════════════════════════════════════════════════════════════════════
describe("Test 6 – WalletCard", () => {
    it("shows formatted XLM balance and 'no transactions yet'", () => {
        render(
            <WalletCard
                address={ADDR_A}
                balance={987.654}
                txHistory={[]}
                onDisconnect={vi.fn()}
            />
        );
        expect(screen.getByText(/987/)).toBeInTheDocument();
        expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
    });

    it("shows ⚡ Cached badge when balanceFromCache=true", () => {
        render(
            <WalletCard
                address={ADDR_A}
                balance={100}
                txHistory={[]}
                onDisconnect={vi.fn()}
                balanceFromCache={true}
            />
        );
        expect(screen.getByText(/cached/i)).toBeInTheDocument();
    });

    it("calls onDisconnect when Disconnect button is clicked", () => {
        const onDisconnect = vi.fn();
        render(
            <WalletCard
                address={ADDR_A}
                balance={100}
                txHistory={[]}
                onDisconnect={onDisconnect}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
        expect(onDisconnect).toHaveBeenCalledOnce();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 7 – ContractStatsCard
// ════════════════════════════════════════════════════════════════════════════
describe("Test 7 – ContractStatsCard", () => {
    it("renders payment count and volume labels", () => {
        render(
            <ContractStatsCard
                state={{ totalVolume: 1234.5, totalPayments: 7 }}
                loading={false}
            />
        );
        expect(screen.getByText("7")).toBeInTheDocument();
        expect(screen.getByText(/total payments/i)).toBeInTheDocument();
        expect(screen.getByText(/total volume/i)).toBeInTheDocument();
    });

    it("shows '—' placeholders in both stat boxes when loading=true", () => {
        render(
            <ContractStatsCard
                state={{ totalVolume: 0, totalPayments: 0 }}
                loading={true}
            />
        );
        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThanOrEqual(2);
    });

    it("shows Cached badge when fromCache=true", () => {
        render(
            <ContractStatsCard
                state={{ totalVolume: 500, totalPayments: 3 }}
                loading={false}
                fromCache={true}
            />
        );
        expect(screen.getByText(/cached/i)).toBeInTheDocument();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 8 – ErrorToast notification system
// ════════════════════════════════════════════════════════════════════════════
describe("Test 8 – ErrorToast", () => {
    it("renders all 3 toasts at once", () => {
        render(
            <ErrorToast
                toasts={[
                    { id: "t1", type: "error", title: "Error", message: "Something broke" },
                    { id: "t2", type: "success", title: "Done", message: "Payment sent!" },
                    { id: "t3", type: "warning", title: "Warning", message: "Low balance" },
                ]}
                onDismiss={vi.fn()}
            />
        );
        expect(screen.getByText("Something broke")).toBeInTheDocument();
        expect(screen.getByText("Payment sent!")).toBeInTheDocument();
        expect(screen.getByText("Low balance")).toBeInTheDocument();
    });

    it("calls onDismiss with correct id when close button is clicked", () => {
        const onDismiss = vi.fn();
        render(
            <ErrorToast
                toasts={[{ id: "toast-99", type: "error", title: "Err", message: "Fail" }]}
                onDismiss={onDismiss}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
        expect(onDismiss).toHaveBeenCalledWith("toast-99");
    });

    it("renders null when toasts array is empty", () => {
        const { container } = render(<ErrorToast toasts={[]} onDismiss={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 9 – Stellar utility functions (pure, no network)
// ════════════════════════════════════════════════════════════════════════════
describe("Test 9 – Stellar utility functions", () => {
    it("isValidStellarAddress: accepts a valid 56-char G-address (ADDR_A)", () => {
        expect(ADDR_A.length).toBe(56);
        expect(isValidStellarAddress(ADDR_A)).toBe(true);
    });

    it("isValidStellarAddress: accepts ADDR_B", () => {
        expect(ADDR_B.length).toBe(56);
        expect(isValidStellarAddress(ADDR_B)).toBe(true);
    });

    it("isValidStellarAddress: rejects empty string", () => {
        expect(isValidStellarAddress("")).toBe(false);
    });

    it("isValidStellarAddress: rejects short (< 56 chars) address", () => {
        expect(isValidStellarAddress("GABCDEF")).toBe(false);
    });

    it("isValidStellarAddress: rejects address not starting with G", () => {
        const bad = "X" + ADDR_A.slice(1); // still 56 chars, invalid start
        expect(isValidStellarAddress(bad)).toBe(false);
    });

    it("formatXLM: returns '0' for zero", () => {
        expect(formatXLM(0)).toBe("0");
    });

    it("formatXLM: formats large number with thousands separator", () => {
        const result = formatXLM(12345.678);
        expect(result).toContain("12,345");
    });

    it("shortenAddress: contains '...' and is shorter than original", () => {
        const short = shortenAddress(ADDR_A, 4);
        expect(short).toContain("...");
        expect(short.length).toBeLessThan(ADDR_A.length);
    });

    it("timeAgo: returns 'Just now' for current timestamp", () => {
        expect(timeAgo(Date.now())).toBe("Just now");
    });

    it("timeAgo: returns 'm ago' for 5-minute-old timestamp", () => {
        expect(timeAgo(Date.now() - 5 * 60 * 1000)).toContain("m ago");
    });

    it("timeAgo: returns 'h ago' for 2-hour-old timestamp", () => {
        expect(timeAgo(Date.now() - 2 * 60 * 60 * 1000)).toContain("h ago");
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 10 – Quick-amount buttons in SendPaymentForm
// ════════════════════════════════════════════════════════════════════════════
describe("Test 10 – Quick-amount buttons", () => {
    it("clicking '10 XLM' sets amount field to 10", async () => {
        const user = userEvent.setup();
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "idle" }}
                onSend={vi.fn()}
            />
        );
        await user.click(screen.getByRole("button", { name: /^10 xlm$/i }));
        const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
        expect(input.value).toBe("10");
    });

    it("clicking '100 XLM' sets amount field to 100", async () => {
        const user = userEvent.setup();
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "idle" }}
                onSend={vi.fn()}
            />
        );
        await user.click(screen.getByRole("button", { name: /^100 xlm$/i }));
        const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
        expect(input.value).toBe("100");
    });

    it("quick-amount buttons are disabled during pending transaction", () => {
        render(
            <SendPaymentForm
                address={ADDR_A}
                balance={1000}
                txRecord={{ status: "pending", step: "submitting" }}
                onSend={vi.fn()}
            />
        );
        expect(screen.getByRole("button", { name: /^10 xlm$/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /^50 xlm$/i })).toBeDisabled();
    });
});
