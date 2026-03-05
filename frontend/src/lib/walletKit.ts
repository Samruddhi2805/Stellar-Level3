import {
    StellarWalletsKit,
    Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";

// Initialize with Freighter only (most common Stellar wallet)
StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: [new FreighterModule()],
});

function errMsg(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === "object" && "message" in err)
        return String((err as { message: unknown }).message);
    return String(err);
}

/**
 * Opens the Freighter wallet auth modal.
 * Returns the connected wallet address.
 */
export async function connectWallet(): Promise<string> {
    try {
        const { address } = await StellarWalletsKit.authModal();
        return address;
    } catch (err: unknown) {
        const msg = errMsg(err).toLowerCase();
        if (
            msg.includes("not found") ||
            msg.includes("not installed") ||
            msg.includes("extension not found") ||
            msg.includes("is not defined") ||
            msg.includes("cannot read properties of undefined")
        ) {
            throw new Error("WalletNotFound:Freighter");
        }
        if (
            msg.includes("reject") ||
            msg.includes("cancel") ||
            msg.includes("denied") ||
            msg.includes("declined") ||
            msg.includes("closed") ||
            msg.includes("user closed") ||
            msg.includes("dismiss")
        ) {
            throw new Error("TransactionRejected:");
        }
        throw err;
    }
}

/**
 * Signs a transaction XDR with the connected wallet.
 */
export async function signTransaction(
    txXDR: string,
    address: string
): Promise<string> {
    try {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXDR, {
            networkPassphrase: Networks.TESTNET,
            address,
        });
        return signedTxXdr;
    } catch (err: unknown) {
        const msg = errMsg(err).toLowerCase();
        if (
            msg.includes("reject") ||
            msg.includes("cancel") ||
            msg.includes("denied") ||
            msg.includes("declined") ||
            msg.includes("user declined") ||
            msg.includes("closed")
        ) {
            throw new Error("TransactionRejected:");
        }
        throw err;
    }
}

/**
 * Disconnects the current wallet session.
 */
export async function disconnectWallet(): Promise<void> {
    try {
        await StellarWalletsKit.disconnect();
    } catch {
        /* ignore */
    }
}
