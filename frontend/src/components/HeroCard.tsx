interface HeroCardProps {
    onConnect: () => void;
    loading: boolean;
}

export default function HeroCard({ onConnect, loading }: HeroCardProps) {
    return (
        <div className="glass-card hero-card">
            <div className="shimmer-top" />
            <div className="corner-glow" />

            {/* Eyebrow */}
            <p className="eyebrow">STELLAR TESTNET</p>

            {/* Floating Diamond */}
            <div className="diamond-wrap">
                <span className="diamond-icon">◈</span>
            </div>

            {/* Title */}
            <h1 className="hero-title">
                Send <span className="gradient-text">XLM</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
                Fast, borderless payments on the Stellar network, powered by Soroban smart contracts
            </p>

            {/* Instruction */}
            <p className="hero-instruction">
                Connect your Freighter wallet to start sending XLM instantly on Stellar Testnet.
                All transactions are real and verifiable on Stellar Explorer.
            </p>

            {/* Connect Button */}
            <button
                id="hero-connect-btn"
                className="btn-primary"
                onClick={onConnect}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="spinner-sm" />
                        Connecting…
                    </>
                ) : (
                    <>⚡ Connect Freighter</>
                )}
            </button>
        </div>
    );
}
