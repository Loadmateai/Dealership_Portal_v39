import React from 'react';

const GridSkeleton = () => {
    // High Contrast Gradient:
    // Light Grey -> Darker Grey (Highlight) -> Light Grey
    const shimmerStyle = {
        background: 'linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear', // Slowed down to 2s
        borderRadius: '4px',
    };

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '20px', 
            width: '100%' 
        }}>
            {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{ 
                    height: '180px', 
                    background: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #cbd5e1', // Darker border
                    padding: '16px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    boxSizing: 'border-box'
                }}>
                    {/* Icon Area */}
                    <div style={{ ...shimmerStyle, width: '40px', height: '40px', borderRadius: '8px', marginBottom: '16px' }}></div>

                    {/* Title Area */}
                    <div style={{ ...shimmerStyle, width: '80%', height: '16px', marginBottom: '8px' }}></div>
                    
                    {/* Subtitle Area */}
                    <div style={{ ...shimmerStyle, width: '60%', height: '16px' }}></div>

                    {/* Bottom Button Area */}
                    <div style={{ ...shimmerStyle, width: '50%', height: '24px', marginTop: 'auto', borderRadius: '6px' }}></div>
                </div>
            ))}
            
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default GridSkeleton;