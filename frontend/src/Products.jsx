import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; // 🚀 IMPORT REACT QUERY
import api from './api';
import ProductCustomizationModal from './ProductCustomizationModal';
import PurchaseProgressTracker from './PurchaseProgressTracker'; 
import GridSkeleton from './GridSkeleton';

const Products = ({ addToCart, cart, goToCart, userRole, notify }) => {
    // 🚀 React Query replaces the manual items and loading state
    const [path, setPath] = useState([]); 
    const [currentParentId, setCurrentParentId] = useState('root'); 
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 🚀 THE NEW CACHED FETCH LOGIC
    const { data: items = [], isLoading: loading } = useQuery({
        // Unique cache key for each category/folder
        queryKey: ['products', currentParentId],
        queryFn: async () => {
            // Preserving your exact UI smoothness logic!
            const minDelay = new Promise(resolve => setTimeout(resolve, 200));
            const apiCall = api.get(`/api/products?parent=${currentParentId}`);
            
            const [_, res] = await Promise.all([minDelay, apiCall]);
            return res.data;
        },
        // Products catalog rarely changes by the minute, so we cache it for 15 minutes.
        staleTime: 1000 * 60 * 15 
    });

    const handleItemClick = (item) => {
        if (!item.isProduct) {
            setPath([...path, { id: item._id, title: item.title }]);
            setCurrentParentId(item._id);
        }
    };

    const handleBack = () => {
        const newPath = [...path];
        newPath.pop(); 
        setPath(newPath);
        const prevId = newPath.length > 0 ? newPath[newPath.length - 1].id : 'root';
        setCurrentParentId(prevId);
    };

    const initiateAddToCart = (item) => setSelectedProduct(item);
    
    const confirmAddToCart = (customizedItem) => {
        addToCart(customizedItem); 
        setSelectedProduct(null);
    };

    const handleOpenPdf = (url) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            if(notify) notify("Document not available.", "error");
        }
    };

    // --- STYLES (100% Untouched) ---
    const styles = {
        container: { 
            maxWidth: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px', 
            boxSizing: 'border-box',
            overflowY: 'auto' 
        },
        header: {
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white',
            padding: '12px 24px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #f1f5f9',
            flexShrink: 0
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '20px',
            paddingBottom: '20px'
        },
        card: {
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between', 
            height: '340px', 
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
        },
        titleContainer: {
            padding: '12px 12px 0 12px', 
            textAlign: 'left',
            height: '48px' 
        },
        title: {
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#1e293b',
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            lineHeight: '1.4',
            margin: 0
        },
        imageContainer: {
            flex: 1,
            width: '100%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            boxSizing: 'border-box',
            overflow: 'hidden'
        },
        image: { 
            maxHeight: '100%', 
            maxWidth: '100%', 
            objectFit: 'contain', 
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' 
        },
        content: { 
            padding: '12px', 
            width: '100%',
            boxSizing: 'border-box',
            background: 'white',
            borderTop: '1px solid #f1f5f9'
        },
        buttonGroup: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr', 
            gap: '6px', 
            width: '100%'
        },
        actionBtn: {
            padding: '6px 0', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '11px',
            transition: 'background 0.2s',
            color: 'white',
            width: '100%'
        },
        folderBtn: {
            width: '100%',
            padding: '8px 0',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            color: '#475569',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
        }
    };

    return (
        <div style={styles.container}>
            
            <PurchaseProgressTracker currentStep="Product Selection" />

            <div style={styles.header}>
                <div>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
                        {path.length === 0 ? 'Categories' : path[path.length - 1].title}
                    </h2>
                </div>
                {path.length > 0 && (
                    <button 
                        onClick={handleBack} 
                        style={{ 
                            height: '36px',
                            padding: '0 16px', 
                            background: 'white', 
                            border: '1px solid #cbd5e1', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '600', 
                            color: '#475569', 
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        ← Back
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ marginTop: '20px' }}>
                    <GridSkeleton />
                </div>
            ) : (
                <div style={styles.grid}>
                    {items.map(item => (
                        <div 
                            key={item._id} 
                            style={styles.card}
                            onClick={() => handleItemClick(item)}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                        >
                            <div style={styles.titleContainer}>
                                <div style={styles.title} title={item.title}>{item.title}</div>
                            </div>
                            <div style={styles.imageContainer}>
                                {item.image ? (
                                    <img src={item.image} alt={item.title} style={styles.image} />
                                ) : (
                                    <span style={{ fontSize: item.isProduct ? '32px' : '50px', opacity: 0.2, transition: 'font-size 0.3s' }}>
                                        {item.isProduct ? '⚙️' : '📁'}
                                    </span>
                                )}
                            </div>
                            <div style={styles.content}>
                                {item.isProduct ? (
                                    <div style={styles.buttonGroup}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); initiateAddToCart(item); }}
                                            style={{...styles.actionBtn, background: '#3b82f6', gridColumn: 'span 2'}} 
                                            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                                            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                                        >
                                            Add to Cart
                                        </button>
                                        
                                        {item.brochurePdf && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenPdf(item.brochurePdf); }}
                                                style={{...styles.actionBtn, background: '#64748b'}}
                                                onMouseEnter={(e) => e.target.style.background = '#475569'}
                                                onMouseLeave={(e) => e.target.style.background = '#64748b'}
                                            >
                                                Brochure
                                            </button>
                                        )}

                                        {item.standardDrawingPdf && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenPdf(item.standardDrawingPdf); }}
                                                style={{...styles.actionBtn, background: '#64748b'}}
                                                onMouseEnter={(e) => e.target.style.background = '#475569'}
                                                onMouseLeave={(e) => e.target.style.background = '#64748b'}
                                            >
                                                Drawing
                                            </button>
                                        )}

                                        {item.technicalDetailsPdf && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenPdf(item.technicalDetailsPdf); }}
                                                style={{...styles.actionBtn, background: '#64748b', gridColumn: 'span 2'}}
                                                onMouseEnter={(e) => e.target.style.background = '#475569'}
                                                onMouseLeave={(e) => e.target.style.background = '#64748b'}
                                            >
                                                Technical Details
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 'auto' }}>
                                        <button 
                                            style={styles.folderBtn}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                        >
                                            <span>Open</span> 
                                            <span>→</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedProduct && <ProductCustomizationModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onConfirm={confirmAddToCart} userRole={userRole} />}
        </div>
    );
};

export default Products;