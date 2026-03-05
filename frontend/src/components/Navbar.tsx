import { shortenAddress } from "../lib/stellar";

interface NavbarProps {
    connected: boolean;
    address: string;
    onConnect: () => void;
    connectLoading: boolean;
}

export default function Navbar({ connected, address, onConnect, connectLoading }: NavbarProps) {
    return (
        <nav className="navbar">
            {/* Logo */}
            <div className="logo">
                <div className="logo-gem">💎</div>
                <span className="logo-text">Stellar dApp</span>
            </div>

            {/* Right */}
            <div className="wallet-info">
                {connected && address ? (
                    <>
                        <div className="pulse-dot" />
                        <span className="wallet-address" title={address}>
                            {shortenAddress(address, 6)}
                        </span>
                    </>
                ) : (
                    <button
                        id="navbar-connect-btn"
                        className="btn-connect-nav"
                        onClick={onConnect}
                        disabled={connectLoading}
                    >
                        {connectLoading ? "Connecting…" : "⚡ Connect"}
                    </button>
                )}
            </div>
        </nav>
    );
}
