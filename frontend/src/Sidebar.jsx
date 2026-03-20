import React, { useState } from 'react';

// Helper component for hoverable menu items
const MenuItem = ({ name, label, activeView, setView, icon, onClick }) => {
    const [hover, setHover] = useState(false);
    const isActive = activeView === name;

    const style = {
        padding: '10px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderRadius: '6px',
        margin: '4px 12px',
        transition: 'all 0.2s ease',
        background: isActive ? 'rgba(255, 255, 255, 0.1)' : hover ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        color: isActive ? '#ffffff' : '#94a3b8',
        fontWeight: isActive ? '600' : '500',
        borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
        textDecoration: 'none',
        fontSize: '14px',
    };

    return (
        <div 
            style={style} 
            onClick={() => { setView(name); if(onClick) onClick(); }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <span>{label}</span>
        </div>
    );
};

const Sidebar = ({ setView, activeView, userRole, isMobile, isOpen, onClose }) => {
    const sidebarStyle = {
        width: '240px',
        height: '100vh',
        background: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: isMobile ? (isOpen ? '0' : '-240px') : '0', // Mobile slide logic
        top: 0,
        boxShadow: isMobile && isOpen ? '4px 0 10px rgba(0,0,0,0.5)' : '4px 0 10px rgba(0,0,0,0.1)',
        zIndex: 2000, // Higher than everything
        borderRight: '1px solid rgba(255,255,255,0.05)',
        transition: 'left 0.3s ease-in-out'
    };

    const headerStyle = {
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    };

    // Close sidebar when an item is clicked on mobile
    const handleItemClick = () => {
        if (isMobile && onClose) onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div 
                    onClick={onClose}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1999,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <div style={sidebarStyle}>
                <div style={headerStyle}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', color: 'white' }}>
                            <span style={{ color: '#60a5fa' }}>LOAD</span>MATE
                        </h2>
                        {isMobile && (
                            <button 
                                onClick={onClose}
                                style={{background:'transparent', border:'none', color:'white', fontSize:'20px', cursor:'pointer'}}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <small style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Dealership Portal</small>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                    {userRole !== 'sub' && (
                        <MenuItem name="home" label="Dashboard" icon="📊" activeView={activeView} setView={setView} onClick={handleItemClick} />
                    )}
                    
                    <MenuItem name="products" label="Products" icon="📦" activeView={activeView} setView={setView} onClick={handleItemClick} />
                    
                    {userRole !== 'sub' && (
                        <>
                            <MenuItem name="lead-product-status" label="Leads" icon="🤝" activeView={activeView} setView={setView} onClick={handleItemClick} />
                            <MenuItem name="product-order-status" label="Orders" icon="📝" activeView={activeView} setView={setView} onClick={handleItemClick} />
                            <MenuItem name="ticket-status" label="Support" icon="🎧" activeView={activeView} setView={setView} onClick={handleItemClick} />
                        </>
                    )}
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
                    v12.0.0
                </div>
            </div>
        </>
    );
};

export default Sidebar;