'use client';

import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FeaturedProduct {
  id: string;
  name: string;
  priceCredits: string;
  imageUrl: string | null;
  category: string | null;
}

export default function HomePage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=6');
      if (res.ok) {
        const data = await res.json();
        setFeaturedProducts(data.products.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <main className="homepage">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">🌐</span>
            <span className="logo-text">Web3 Marketplace</span>
          </div>
          <nav className="nav">
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#marketplace" className="nav-link">Marketplace</Link>
            <Link href="#nfts" className="nav-link">NFTs</Link>
            <Link href="#sellers" className="nav-link">Become a Seller</Link>
          </nav>
          <button
            className="btn btn-primary connect-btn"
            onClick={handleLogin}
            disabled={isLoginLoading || isLoading}
          >
            {isLoginLoading ? 'Connecting...' : '🔗 Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <div className="hero-badge">🚀 Powered by Ethereum</div>
          <h1>The Future of <span className="gradient-text">Digital Commerce</span></h1>
          <p className="hero-subtitle">
            Buy, sell, and trade digital products & NFTs with cryptocurrency.
            Join thousands of creators and collectors on the most secure Web3 marketplace.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-lg" onClick={handleLogin} disabled={isLoginLoading}>
              {isLoginLoading ? 'Connecting...' : 'Start Shopping'}
            </button>
            <Link href="#sellers" className="btn btn-secondary btn-lg">
              Become a Seller
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat">
              <span className="stat-value">$5M+</span>
              <span className="stat-label">Volume Traded</span>
            </div>
            <div className="stat">
              <span className="stat-value">500+</span>
              <span className="stat-label">Verified Sellers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why Choose Web3 Marketplace?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Payments</h3>
            <p>Pay with USDT on Ethereum. Your funds are protected by blockchain security.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Delivery</h3>
            <p>Digital products delivered instantly after payment confirmation.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>NFT Marketplace</h3>
            <p>Buy and sell verified NFTs from top creators worldwide.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Low Fees</h3>
            <p>Only 2.5% platform fee. Keep more of your earnings.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Buyer Protection</h3>
            <p>Full refund guarantee if products don&apos;t match description.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Access</h3>
            <p>No borders, no banks. Trade with anyone, anywhere.</p>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section id="marketplace" className="marketplace-preview">
        <h2>Featured Products</h2>
        <p className="section-subtitle">Discover trending digital products and exclusive items</p>
        <div className="products-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">📦</div>
                  )}
                  <div className="product-category">{product.category || 'Digital'}</div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <span className="product-price">{parseFloat(product.priceCredits).toLocaleString()} USDT</span>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="product-card skeleton"></div>
              <div className="product-card skeleton"></div>
              <div className="product-card skeleton"></div>
            </>
          )}
        </div>
        <button className="btn btn-secondary" onClick={handleLogin}>
          View All Products →
        </button>
      </section>

      {/* NFT Section */}
      <section id="nfts" className="nft-section">
        <div className="nft-content">
          <h2>🎨 NFT Marketplace</h2>
          <p>
            Trade unique digital art, collectibles, and virtual assets.
            Our NFT marketplace supports Ethereum-based tokens with
            verified authenticity and ownership.
          </p>
          <ul className="nft-features">
            <li>✓ Verified Collections</li>
            <li>✓ Royalty Payments to Creators</li>
            <li>✓ Gas-Optimized Transactions</li>
            <li>✓ Cross-Chain Coming Soon</li>
          </ul>
          <button className="btn btn-primary" onClick={handleLogin}>
            Explore NFTs
          </button>
        </div>
        <div className="nft-visual">
          <div className="nft-card">🖼️</div>
          <div className="nft-card">🎭</div>
          <div className="nft-card">🎵</div>
        </div>
      </section>

      {/* Become a Seller */}
      <section id="sellers" className="sellers-section">
        <h2>Become a Seller</h2>
        <p className="section-subtitle">Start selling your digital products and earn crypto</p>
        <div className="seller-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Apply</h3>
            <p>Fill out the seller application and verify your identity</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>List</h3>
            <p>Upload your products with images and set your prices</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Earn</h3>
            <p>Get paid in USDT directly to your wallet</p>
          </div>
        </div>
        <div className="seller-cta">
          <button className="btn btn-primary btn-lg" onClick={handleLogin}>
            Apply to Become a Seller
          </button>
          <p className="seller-note">Applications reviewed within 24 hours</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-icon">🌐</span>
                <span className="logo-text">Web3 Marketplace</span>
              </div>
              <p className="footer-about">
                The premier decentralized marketplace for digital products and NFTs.
                We connect creators with collectors using the power of blockchain technology.
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Marketplace</h4>
                <ul>
                  <li><a href="#">All Products</a></li>
                  <li><a href="#">NFT Collections</a></li>
                  <li><a href="#">Top Sellers</a></li>
                  <li><a href="#">New Arrivals</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Sellers</h4>
                <ul>
                  <li><a href="#">Become a Seller</a></li>
                  <li><a href="#">Seller Guidelines</a></li>
                  <li><a href="#">Seller Dashboard</a></li>
                  <li><a href="#">Fee Structure</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <ul>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Report an Issue</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Web3 Marketplace. Powered by Ethereum.</p>
            <div className="footer-social">
              <a href="#" className="social-link">𝕏</a>
              <a href="#" className="social-link">Discord</a>
              <a href="#" className="social-link">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%);
        }

        /* Header */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(10, 10, 26, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 20px;
          color: white;
        }

        .logo-icon {
          font-size: 28px;
        }

        .nav {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: white;
        }

        .connect-btn {
          padding: 10px 24px;
        }

        /* Hero Section */
        .hero {
          position: relative;
          padding: 180px 32px 120px;
          text-align: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
          z-index: 0;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-block;
          padding: 8px 16px;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 24px;
          font-size: 13px;
          color: #A78BFA;
          margin-bottom: 24px;
        }

        .hero h1 {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 60px;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 16px;
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 60px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 36px;
          font-weight: 700;
          color: white;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Features Section */
        .features {
          padding: 100px 32px;
          text-align: center;
        }

        .features h2 {
          font-size: 40px;
          font-weight: 700;
          margin-bottom: 60px;
        }

        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px 30px;
          text-align: center;
          transition: transform 0.3s, border-color 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-size: 18px;
          margin-bottom: 12px;
        }

        .feature-card p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          line-height: 1.6;
        }

        /* Marketplace Preview */
        .marketplace-preview {
          padding: 100px 32px;
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .marketplace-preview h2 {
          font-size: 40px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .section-subtitle {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 48px;
        }

        .products-grid {
          max-width: 1200px;
          margin: 0 auto 40px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .product-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 30, 60, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s;
        }

        .product-card:hover {
          transform: translateY(-4px);
        }

        .product-card.skeleton {
          height: 300px;
          background: rgba(255, 255, 255, 0.05);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.3; }
        }

        .product-image {
          position: relative;
          height: 200px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-placeholder {
          font-size: 48px;
        }

        .product-category {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(139, 92, 246, 0.9);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .product-info {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .product-info h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .product-price {
          color: #10B981;
          font-weight: 700;
        }

        /* NFT Section */
        .nft-section {
          padding: 100px 32px;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .nft-content h2 {
          font-size: 40px;
          margin-bottom: 20px;
        }

        .nft-content p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .nft-features {
          list-style: none;
          padding: 0;
          margin-bottom: 32px;
        }

        .nft-features li {
          padding: 8px 0;
          color: #10B981;
          font-weight: 500;
        }

        .nft-visual {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .nft-card {
          width: 140px;
          height: 180px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          transform: rotate(-5deg);
          transition: transform 0.3s;
        }

        .nft-card:nth-child(2) {
          transform: rotate(0deg) translateY(-20px);
        }

        .nft-card:nth-child(3) {
          transform: rotate(5deg);
        }

        /* Sellers Section */
        .sellers-section {
          padding: 100px 32px;
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .sellers-section h2 {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .seller-steps {
          max-width: 900px;
          margin: 48px auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .step {
          text-align: center;
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto 20px;
        }

        .step h3 {
          font-size: 20px;
          margin-bottom: 12px;
        }

        .step p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .seller-cta {
          margin-top: 40px;
        }

        .seller-note {
          margin-top: 16px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }

        /* Footer */
        .footer {
          background: rgba(0, 0, 0, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 80px 32px 40px;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 60px;
          margin-bottom: 60px;
        }

        .footer-about {
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.7;
          margin-top: 16px;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
        }

        .footer-column h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          color: white;
        }

        .footer-column ul {
          list-style: none;
          padding: 0;
        }

        .footer-column li {
          margin-bottom: 10px;
        }

        .footer-column a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-column a:hover {
          color: white;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-bottom p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }

        .footer-social {
          display: flex;
          gap: 16px;
        }

        .social-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .social-link:hover {
          color: white;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .features-grid, .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .nft-section {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .footer-main {
            grid-template-columns: 1fr;
          }

          .footer-links {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .nav {
            display: none;
          }

          .hero h1 {
            font-size: 40px;
          }

          .hero-stats {
            flex-direction: column;
            gap: 24px;
          }

          .features-grid, .products-grid, .seller-steps {
            grid-template-columns: 1fr;
          }

          .footer-links {
            grid-template-columns: 1fr 1fr;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
