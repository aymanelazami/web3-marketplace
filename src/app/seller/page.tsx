'use client';

import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SellerData {
    id: string;
    storeName: string;
    storeDescription: string | null;
    logoUrl: string | null;
    status: string;
    totalSales: string;
    totalEarnings: string;
    rating: string;
    reviewCount: number;
    verifiedAt: string | null;
}

interface Product {
    id: string;
    name: string;
    priceCredits: string;
    imageUrl: string | null;
    category: string | null;
    productType: string;
    stock: number | null;
    isActive: boolean;
}

export default function SellerDashboard() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [seller, setSeller] = useState<SellerData | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isSeller, setIsSeller] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [formData, setFormData] = useState({
        storeName: '',
        storeDescription: '',
        email: '',
        website: '',
        applicationNote: '',
    });
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        priceCredits: '',
        category: 'Digital',
        productType: 'digital',
        stock: '',
    });
    const [imageUrl, setImageUrl] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSellerStatus();
        }
    }, [isAuthenticated]);

    const fetchSellerStatus = async () => {
        try {
            const res = await fetch('/api/seller');
            if (res.ok) {
                const data = await res.json();
                setIsSeller(data.isSeller);
                setSeller(data.seller);
                if (data.seller?.status === 'APPROVED') {
                    fetchProducts();
                }
            }
        } catch (error) {
            console.error('Failed to fetch seller status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/seller/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                fetchSellerStatus();
                setShowApplyForm(false);
            }
        } catch (error) {
            console.error('Failed to apply:', error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'product') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const { url } = await res.json();
                if (type === 'image') {
                    setImageUrl(url);
                } else {
                    setFileUrl(url);
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/seller/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...productData,
                    imageUrl,
                    fileUrl,
                }),
            });
            if (res.ok) {
                fetchProducts();
                setShowAddProduct(false);
                setProductData({ name: '', description: '', priceCredits: '', category: 'Digital', productType: 'digital', stock: '' });
                setImageUrl('');
                setFileUrl('');
            }
        } catch (error) {
            console.error('Failed to add product:', error);
        }
    };

    if (isLoading || loading) {
        return <div className="loading"><div className="spinner" /></div>;
    }

    return (
        <main className="seller-dashboard">
            <header className="page-header">
                <div className="header-left">
                    <Link href="/dashboard" className="back-link">← Back to Store</Link>
                    <h1>🏪 Seller Dashboard</h1>
                </div>
            </header>

            {!isSeller && (
                <div className="no-seller">
                    <div className="apply-card">
                        <h2>Become a Seller</h2>
                        <p>Start selling your digital products, NFTs, and more on our platform.</p>
                        {!showApplyForm ? (
                            <button className="btn btn-primary btn-lg" onClick={() => setShowApplyForm(true)}>
                                Apply Now
                            </button>
                        ) : (
                            <form onSubmit={handleApply} className="apply-form">
                                <input
                                    type="text"
                                    placeholder="Store Name *"
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Store Description"
                                    value={formData.storeDescription}
                                    onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                                />
                                <input
                                    type="email"
                                    placeholder="Contact Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <input
                                    type="url"
                                    placeholder="Website (optional)"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                                <textarea
                                    placeholder="Why do you want to become a seller?"
                                    value={formData.applicationNote}
                                    onChange={(e) => setFormData({ ...formData, applicationNote: e.target.value })}
                                />
                                <div className="form-buttons">
                                    <button type="submit" className="btn btn-primary">Submit Application</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {isSeller && seller?.status === 'PENDING' && (
                <div className="status-card pending">
                    <h2>⏳ Application Pending</h2>
                    <p>Your seller application is under review. We&apos;ll notify you once it&apos;s approved.</p>
                </div>
            )}

            {isSeller && seller?.status === 'REJECTED' && (
                <div className="status-card rejected">
                    <h2>❌ Application Rejected</h2>
                    <p>Unfortunately, your application was not approved. You can reapply with updated information.</p>
                </div>
            )}

            {isSeller && seller?.status === 'APPROVED' && (
                <>
                    <div className="seller-stats">
                        <div className="stat-card">
                            <span className="stat-value">${parseFloat(seller.totalSales).toLocaleString()}</span>
                            <span className="stat-label">Total Sales</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">${parseFloat(seller.totalEarnings).toLocaleString()}</span>
                            <span className="stat-label">Your Earnings</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{products.length}</span>
                            <span className="stat-label">Products Listed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">⭐ {seller.rating}</span>
                            <span className="stat-label">{seller.reviewCount} Reviews</span>
                        </div>
                    </div>

                    <div className="products-section">
                        <div className="section-header">
                            <h2>Your Products</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>
                                {showAddProduct ? 'Cancel' : '+ Add Product'}
                            </button>
                        </div>

                        {showAddProduct && (
                            <form onSubmit={handleAddProduct} className="add-product-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Product Name *</label>
                                        <input
                                            type="text"
                                            value={productData.name}
                                            onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price (USDT) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={productData.priceCredits}
                                            onChange={(e) => setProductData({ ...productData, priceCredits: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={productData.category}
                                            onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                                        >
                                            <option>Digital</option>
                                            <option>NFT</option>
                                            <option>Software</option>
                                            <option>Template</option>
                                            <option>Course</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select
                                            value={productData.productType}
                                            onChange={(e) => setProductData({ ...productData, productType: e.target.value })}
                                        >
                                            <option value="digital">Digital Product</option>
                                            <option value="nft">NFT</option>
                                            <option value="physical">Physical Item</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group full">
                                    <label>Description *</label>
                                    <textarea
                                        value={productData.description}
                                        onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Product Image</label>
                                        <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'image')} />
                                        {imageUrl && <img src={imageUrl} alt="Preview" className="preview-img" />}
                                    </div>
                                    <div className="form-group">
                                        <label>Digital File (for delivery)</label>
                                        <input type="file" onChange={(e) => handleUpload(e, 'product')} />
                                        {fileUrl && <span className="file-attached">✓ File attached</span>}
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Create Product'}
                                </button>
                            </form>
                        )}

                        <div className="products-grid">
                            {products.map((product) => (
                                <div key={product.id} className="product-card">
                                    <div className="product-image">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} />
                                        ) : (
                                            <div className="placeholder">📦</div>
                                        )}
                                        <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="product-info">
                                        <h3>{product.name}</h3>
                                        <div className="product-meta">
                                            <span className="price">${parseFloat(product.priceCredits).toLocaleString()}</span>
                                            <span className="category">{product.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="empty-products">
                                    <p>No products yet. Add your first product!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
        .seller-dashboard { min-height: 100vh; padding: 24px; }
        .page-header { max-width: 1200px; margin: 0 auto 32px; }
        .header-left { display: flex; flex-direction: column; gap: 16px; }
        .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 14px; }
        .page-header h1 { font-size: 28px; }

        .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }

        .no-seller, .status-card { max-width: 600px; margin: 60px auto; }
        .apply-card, .status-card { background: linear-gradient(135deg, rgba(30,30,50,0.8) 0%, rgba(20,30,60,0.8) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; text-align: center; }
        .apply-card h2 { font-size: 24px; margin-bottom: 16px; }
        .apply-card p { color: rgba(255,255,255,0.6); margin-bottom: 24px; }

        .apply-form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
        .apply-form input, .apply-form textarea { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; }
        .apply-form textarea { min-height: 100px; resize: vertical; }
        .form-buttons { display: flex; gap: 12px; }

        .status-card.pending { border-color: rgba(245,158,11,0.3); }
        .status-card.rejected { border-color: rgba(239,68,68,0.3); }

        .seller-stats { max-width: 1200px; margin: 0 auto 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-card { background: linear-gradient(135deg, rgba(30,30,50,0.8) 0%, rgba(20,30,60,0.8) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; text-align: center; }
        .stat-value { display: block; font-size: 28px; font-weight: 700; color: #8B5CF6; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.5); }

        .products-section { max-width: 1200px; margin: 0 auto; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-header h2 { font-size: 20px; }

        .add-product-form { background: linear-gradient(135deg, rgba(30,30,50,0.8) 0%, rgba(20,30,60,0.8) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { width: 100%; margin-bottom: 16px; }
        .form-group label { font-size: 12px; color: rgba(255,255,255,0.6); }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .preview-img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-top: 8px; }
        .file-attached { color: #10B981; font-size: 13px; }

        .products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .product-card { background: linear-gradient(135deg, rgba(30,30,50,0.8) 0%, rgba(20,30,60,0.8) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; }
        .product-image { position: relative; height: 150px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
        .product-image img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder { font-size: 36px; }
        .status-badge { position: absolute; top: 8px; right: 8px; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; }
        .status-badge.active { background: rgba(16,185,129,0.2); color: #10B981; }
        .status-badge.inactive { background: rgba(107,114,128,0.2); color: #9CA3AF; }
        .product-info { padding: 16px; }
        .product-info h3 { font-size: 14px; margin-bottom: 8px; }
        .product-meta { display: flex; justify-content: space-between; font-size: 13px; }
        .price { color: #10B981; font-weight: 600; }
        .category { color: rgba(255,255,255,0.5); }

        .empty-products { grid-column: 1 / -1; text-align: center; padding: 60px; color: rgba(255,255,255,0.5); }

        @media (max-width: 768px) {
          .seller-stats { grid-template-columns: repeat(2, 1fr); }
          .products-grid { grid-template-columns: repeat(2, 1fr); }
          .form-grid, .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
        </main>
    );
}
