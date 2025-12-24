# Web3 Marketplace

A premium, modern Web3 Marketplace for digital products built with **Next.js 15**, **React**, and **Prisma**. This platform features a sleek glassmorphic design, seamless crypto integration, and a comprehensive administration system.

![GitHub last commit](https://img.shields.io/github/last-commit/aymanelazami/web3-marketplace)
![GitHub top language](https://img.shields.io/github/languages/top/aymanelazami/web3-marketplace)

## 🚀 Key Features

### 💎 User Experience & Dashboard
- **Glassmorphic UI**: High-end design with gradients and smooth animations.
- **SIWE Auth**: Secure "Sign-In with Ethereum" via MetaMask and other providers.
- **Premium Wallet System**: Manual USDT (ERC-20) deposit detection with QR codes.
- **VIP Rewards**: Automated tier system (Bronze, Silver, Gold) based on total spend.
- **Responsive Products**: Grid-based browsing with detailed product views.

### 🛠️ Admin & Seller Management
- **Centralized Admin Panel**: Manage users, products, orders, and system settings.
- **Order Management**: Detailed views for manual processing and status updates.
- **Seller Flow**: Dedicated interface for sellers to manage inventory and sales.
- **Global Settings**: Configure store name, admin wallet, commission rates, and maintenance mode.
- **Audit Logs**: Transparent tracking of all administrative actions.

## 💻 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Premium Custom Design)
- **Database**: SQLite (Development) / Prisma ORM
- **Web3 Integrations**: Ethers.js, Wagmi, Viem, SIWE
- **Utilities**: QRCode.react, Iron Session, Recharts

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
   npm run dev
   ```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📄 License
Custom Project for Educational/Showcase Purposes.

---
Built with ❤️ for the Web3 Community.
