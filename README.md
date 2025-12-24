# Web3 Marketplace

A premium, modern Web3 Marketplace for digital products built with **Next.js 15**, **React**, and **Prisma**. This platform features a sleek glassmorphic design, seamless crypto integration, and a comprehensive administration system.

![GitHub last commit](https://img.shields.io/github/last-commit/aymanelazami/web3-marketplace)
![GitHub top language](https://img.shields.io/github/languages/top/aymanelazami/web3-marketplace)
![License](https://img.shields.io/github/license/aymanelazami/web3-marketplace)

## 🚀 Key Features

### 💎 User Experience & Dashboard
- **Glassmorphic UI**: High-end design with gradients, glassmorphism, and smooth micro-animations.
- **SIWE Auth**: Secure "Sign-In with Ethereum" via MetaMask and other Web3 providers.
- **Premium Wallet System**: Manual USDT (ERC-20) deposit detection with scan-to-pay QR codes.
- **VIP Rewards**: Automated 3-tier system (Bronze, Silver, Gold) based on total spend with custom benefit logic.
- **Centered Dashboard**: Optimized layout for better visual balance and focus on user assets.
- **Notifications**: Real-time system notifications for orders, deposits, and account updates.

### 🛒 Marketplace & Products
- **Digital Products**: Support for various digital assets with instant delivery or manual processing.
- **Product Detail Views**: Rich product pages with images, descriptions, and sufficiency checks ($ balance vs price).
- **Wishlist & Search**: Allow users to save favorites and find products efficiently.
- **Flash Sales**: Scheduled discounts and promotional events logic.

### 🛠️ Administration & Management
- **Centralized Admin Dashboard**: Overview of key metrics (Users, Orders, Revenue) with interactive charts.
- **Comprehensive User Management**: Create, update, or delete users; manage VIP tiers and credit balances.
- **Seller Flow**: Dedicated dashboard for sellers to manage their own products, view sales stats, and track commissions.
- **Order Management**: Detailed order tracking with a "View" modal for deep dives into customer purchases.
- **Global Settings**: Manage store name, support contact, admin wallet addresses, commission rates, and maintenance mode.
- **Transaction Ledger**: Transparent system-wide ledger tracking every credit movement (deposits, purchases, refunds).
- **Audit Logs**: Secure tracking of all administrative actions for accountability.

### 🔗 Affiliates & Marketing
- **Affiliate Program**: Multi-tier referral system with custom commission rates per code.
- **Coupon System**: Create and manage discount codes for marketing campaigns.

## 💻 Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Styling**: Vanilla CSS (Premium Custom Design Tokens)
- **Database**: SQLite (Development) / Prisma ORM
- **Web3 Integrations**: Ethers.js, Wagmi, Viem, SIWE (Sign-In with Ethereum)
- **Charts & Data**: Recharts for administrative analytics
- **Utilities**: QRCode.react, Iron Session for secure auth sessions

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aymanelazami/web3-marketplace.git
   cd web3-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file based on `.env.example`:
   ```bash
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_DEPOSIT_ADDRESS="your_admin_wallet_here"
   SESSION_SECRET="your_long_secret_here"
   # ... other vars
   ```

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev -- -p 3001
   ```

The app will be available at [http://localhost:3001](http://localhost:3001).

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for the Web3 Community.
