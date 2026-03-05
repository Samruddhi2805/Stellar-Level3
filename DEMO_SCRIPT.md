# 🎥 Stellar Payment dApp - Demo Video Script (1 Minute)

## 📋 Scene Breakdown

### [0:00 - 0:10] - Opening & Overview
**Visual:** Full screen dApp with animated aurora background
**Narration:** "This is the Stellar Payment dApp Level 3 — a fully functional dApp running on Stellar Testnet with a Soroban smart contract."

**On-screen highlights:**
- Animated aurora background with floating gradients
- Floating glassmorphism navbar
- "STELLAR TESTNET" badge

---

### [0:10 - 0:20] - UI Tour
**Visual:** Slow pan across the interface
**Narration:** "The dark aurora glassmorphism interface features animated backgrounds, a floating navbar, and the pre-connect hero card with a pulsing diamond animation."

**On-screen highlights:**
- Teal, violet, pink, cyan aurora blobs
- Glassmorphism cards with blur effects
- Floating diamond ◈ animation
- Twinkling stars background

---

### [0:20 - 0:30] - Wallet Connection
**Visual:** Click "⚡ Connect Freighter" button
**Narration:** "Click ⚡ Connect Freighter. The Freighter modal opens. Select Freighter and approve — your address and XLM balance load immediately from the network."

**Actions shown:**
1. Click connect button
2. Freighter extension popup appears
3. Select Freighter wallet
4. Approve connection
5. Balance appears instantly

---

### [0:30 - 0:40] - Sending XLM
**Visual:** Fill out payment form
**Narration:** "Enter a recipient address, type an amount or click a quick-amount button, then click 🚀 Send XLM. The progress steps animate — signing → submitting → confirming."

**Actions shown:**
1. Enter recipient address (G-address)
2. Click "100 XLM" quick button
3. Click "🚀 Send XLM"
4. Progress indicators animate
5. "Waiting for wallet signature..." → "Submitting..." → "Confirming..."

---

### [0:40 - 0:50] - Explorer Verification
**Visual:** Success message with transaction hash
**Narration:** "The green success bar shows the tx hash. Click Explorer ↗ to see the confirmed transaction on stellar.expert."

**Actions shown:**
1. Green success bar appears with tx hash
2. Click "Explorer ↗" link
3. Stellar Expert page opens showing confirmed transaction
4. Show transaction details (sender, receiver, amount, fee)

---

### [0:50 - 1:00] - Contract State & Tests
**Visual:** Contract stats card and test results
**Narration:** "The Contract Stats card shows total volume and payments from the on-chain state. Running `npm test` shows 37 passing tests — all green."

**Actions shown:**
1. Contract Stats card updates with new volume
2. Payment count increases
3. Terminal window showing `npm test` command
4. All 37 tests passing ✅

---

## 🎬 Production Notes

### Recording Setup:
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30fps
- **Browser:** Chrome with Freighter extension
- **Testnet Account:** Pre-funded with sufficient XLM

### Key Visual Elements to Highlight:
1. **Dark Aurora Theme:** Deep space navy (#060612) with animated gradients
2. **Glassmorphism:** Frosted glass effects with backdrop blur
3. **Micro-interactions:** Button hover states, loading spinners, progress bars
4. **Real Data:** Actual Testnet transactions, no mocks

### Required Screenshots for README:
1. **UI Overview:** Full dApp interface (pre-connect)
2. **Connected State:** Wallet connected showing balance
3. **Transaction Success:** Green success bar with Explorer link
4. **Test Results:** Terminal showing 37 passing tests
5. **Contract State:** Updated stats after transaction

### Explorer Verification:
- Use this test transaction hash as example: `a1b2c3d4e5f6...`
- Show stellar.expert/testnet URL
- Highlight on-chain verification

### Test Command Results:
```bash
cd frontend && npm test
✓ Test 1 – App renders HeroCard when not connected (2)
✓ Test 2 – HeroCard loading state (3)
✓ Test 3 – Insufficient balance validation (2)
✓ Test 4 – Recipient address validation (3)
✓ Test 5 – SendPaymentForm transaction states (4)
✓ Test 6 – WalletCard (3)
✓ Test 7 – ContractStatsCard (3)
✓ Test 8 – ErrorToast (3)
✓ Test 9 – Stellar utility functions (11)
✓ Test 10 – Quick-amount buttons (3)

Tests: 37 passed (37)
```

### Contract Tests:
```bash
cd contract && cargo test
running 3 tests
test test::test_payment_and_volume ... ok
test test::test_invalid_amount ... ok
test test::test_multiple_payments ... ok

test result: ok. 3 passed; 0 failed
```

## 🎯 Call to Action (End Screen)
**Text:** "Built with React 19 + Soroban (Rust) on Stellar Testnet"
**GitHub:** github.com/YOUR_USERNAME/stellar-payment-dapp-level3
**Live Demo:** your-app.vercel.app
**Stellar Explorer:** stellar.expert/explorer/testnet/contract/CONTRACT_ID

---

## 📝 Additional Notes

### Error Handling to Demonstrate (Optional):
1. **Insufficient Balance:** Try sending more than available
2. **Invalid Address:** Enter wrong address format
3. **User Rejection:** Cancel transaction in Freighter

### Performance Highlights:
- **Instant Load:** localStorage caching shows data immediately
- **Smooth Animations:** 60fps aurora background
- **Fast Transactions:** ~3-5 second confirmation on Testnet

### Security Features:
- **No Private Keys:** All signing handled by Freighter
- **Testnet Only:** Safe for demonstration
- **Contract Verified:** All transactions on-chain

---

**Total Duration:** Exactly 60 seconds
**Pacing:** Smooth, confident narration matching on-screen actions
**Music:** Subtle ambient background track (optional)
