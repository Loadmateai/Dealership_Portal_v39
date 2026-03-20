import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🚀 IMPORT CACHING HOOKS
import api , {BASE_URL} from './api';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar'; 
import { jwtDecode } from "jwt-decode";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

const SupportTicketForm = lazy(() => import('./SupportTicketForm'));
const SupportStatus = lazy(() => import('./SupportStatus'));
const LeadProductStatus = lazy(() => import('./LeadProductStatus'));
const ProductOrderStatus = lazy(() => import('./ProductOrderStatus'));
const Products = lazy(() => import('./Products'));
const Cart = lazy(() => import('./Cart'));

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ViewLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', width: '100%', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
        <div className="loader-pulse">Loading View...</div>
    </div>
);

const StatsCard = ({ title, value, subtext, icon, color }) => (
    <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
                <p style={{ fontSize: '20px', fontWeight: '700', margin: '4px 0 0 0', color: '#1e293b', lineHeight: '1.2' }}>{value}</p>
            </div>
            <div style={{ background: `${color}15`, color: color, padding: '8px', borderRadius: '6px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
        </div>
        {subtext && <small style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>{subtext}</small>}
    </div>
);

const isRecent = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 7; 
};

const NewBadge = () => (
    <span style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', color: 'white', fontSize: '9px', fontWeight: '700', height: '14px', width: '14px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)', animation: 'badge-pulse 2s infinite' }}>N</span>
);

const Dashboard = ({ token, setToken, notify }) => {
    const queryClient = useQueryClient(); // 🚀 Gives us access to manually clear the cache
    
    const [activeView, setActiveView] = useState('home');
    const [productsRefreshKey, setProductsRefreshKey] = useState(0); 
    const [editingItem, setEditingItem] = useState(null);
    const [cart, setCart] = useState([]); 
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [timeFilter, setTimeFilter] = useState('this_month');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    
    const [vendorSearch, setVendorSearch] = useState('');
    const [debouncedVendorSearch, setDebouncedVendorSearch] = useState(''); 
    const [appliedVendorCode, setAppliedVendorCode] = useState('');
    const [groupSearch, setGroupSearch] = useState('');
    const [appliedGroup, setAppliedGroup] = useState('');

    const [vendorStatus, setVendorStatus] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);  

    const user = token ? jwtDecode(token).user : { name: 'User', documents: {} };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (user.role === 'sub' && activeView === 'home') setActiveView('products');
    }, [user.role, activeView]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedVendorSearch(vendorSearch);
        }, 300);
        return () => clearTimeout(timerId);
    }, [vendorSearch]);

    // 🚀 REACT QUERY: STATS CACHING 
    const { data: stats = {
        productOrders: { count: 0, revenue: 0, breakdown: { 'Pending Approval': 0, 'Ordered': 0, 'Rejected': 0 } },
        leads: { total: 0, won: 0, conversionRate: 0 },
        supportTickets: { count: 0 }
    }} = useQuery({
        queryKey: ['dashboardStats', timeFilter, customDates.start, customDates.end, appliedVendorCode, appliedGroup],
        queryFn: async () => {
            let start, end;
            const now = new Date();
            if (timeFilter === 'this_month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
            } else if (timeFilter === 'last_month') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (timeFilter === 'custom') {
                start = new Date(customDates.start);
                end = new Date(customDates.end);
            }
            const res = await api.get('/api/dashboard/stats', {
                params: { startDate: start.toISOString(), endDate: end.toISOString(), vendorCode: appliedVendorCode, group: appliedGroup },
                headers: { 'x-auth-token': token }
            });
            return res.data;
        },
        enabled: activeView === 'home' && !!token && user.role !== 'sub' && (timeFilter !== 'custom' || (!!customDates.start && !!customDates.end))
    });

    const { data: fetchedVendorStatus } = useQuery({
        queryKey: ['vendorStatus', appliedVendorCode],
        queryFn: async () => {
            const res = await api.get(`/api/auth/vendor-status/${appliedVendorCode}`, { headers: { 'x-auth-token': token } });
            return res.data;
        },
        enabled: !!appliedVendorCode && user.role === 'god' && activeView === 'home'
    });

    useEffect(() => {
        if (fetchedVendorStatus) setVendorStatus(fetchedVendorStatus);
        else if (!appliedVendorCode) setVendorStatus(null);
    }, [fetchedVendorStatus, appliedVendorCode]);

    const { data: vendorSuggestions = [] } = useQuery({
        queryKey: ['vendorSearch', debouncedVendorSearch],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/api/auth/users?search=${debouncedVendorSearch}`, {
                headers: { 'x-auth-token': token }
            });
            return res.json();
        },
        enabled: debouncedVendorSearch.length > 0 && showSuggestions,
        staleTime: 1000 * 60 * 10 
    });

    const toggleCreditLimit = async () => {
        if (!vendorStatus) return;
        const newVal = vendorStatus.creditLimitBreached === 'ON' ? 'OFF' : 'ON';
        if (!window.confirm(`Are you sure you want to turn Credit Limit Enforcement ${newVal}?`)) return;

        try {
            const res = await api.put(`/api/auth/vendor-status/${appliedVendorCode}`, 
                { creditLimitBreached: newVal },
                { headers: { 'x-auth-token': token } }
            );
            setVendorStatus(res.data);
            queryClient.invalidateQueries({ queryKey: ['vendorStatus', appliedVendorCode] });
            if(notify) notify(`Credit Limit Breached set to ${newVal}`, 'success');
        } catch (e) {
             console.error(e);
             if(notify) notify('Error updating status', 'error');
        }
    }

    const handleReset = () => { 
        setTimeFilter('this_month'); 
        setCustomDates({ start: '', end: '' }); 
        setVendorStatus(null); 
        setVendorSearch('');
        setDebouncedVendorSearch(''); 
        setGroupSearch('');
        setAppliedVendorCode('');
        setAppliedGroup('');
    };
    
    const handleEdit = (viewName, item) => { setEditingItem(item); setActiveView(viewName); };
    const handleViewSwitch = (viewName) => { 
        if (viewName === 'products' && activeView === 'products') {
            setProductsRefreshKey(prev => prev + 1); 
        }
        setEditingItem(null); 
        setActiveView(viewName); 
    };
    
    const addToCart = (product) => {
        setCart([...cart, product]);
        if(notify) notify(`${product.title} added to cart!`, 'success');
    };

    // 🚀 MAGIC: This triggers when the Cart checkout is successful
    const handleOrderSuccess = () => {
        setActiveView('lead-product-status'); // Navigate to the leads view
        
        // 1. Update the Dashboard Revenue Numbers
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        
        // 2. Refresh the Leads Table so the brand new lead is instantly visible!
        queryClient.invalidateQueries({ queryKey: ['leadProducts'] }); 
    };

    const openPdf = (docType) => {
        let fileIdentifier = null;
        if (docType === 'privacy') fileIdentifier = user.documents?.privacyPolicy || 'privacy-policy.pdf';
        else if (docType === 'discount') fileIdentifier = user.documents?.discountStructure;
        else if (docType === 'ledger') fileIdentifier = user.documents?.accountLedger;

        if (!fileIdentifier) {
            if (notify) notify(`No ${docType} document available.`, 'error');
            return;
        }

        let finalUrl = fileIdentifier;
        if (fileIdentifier.startsWith('http')) {
            if (fileIdentifier.includes('localhost')) {
                finalUrl = fileIdentifier.replace('http://localhost:5000', BASE_URL);
            }
        } else {
            finalUrl = `${BASE_URL}/uploads/${fileIdentifier}`;
        }
        window.open(finalUrl, '_blank');
    };
    
    const chartData = {
        labels: [ 'Ordered','Pending', 'Rejected'],
        datasets: [{
            label: 'Orders',
            data: [ stats.productOrders.breakdown['Ordered'],stats.productOrders.breakdown['Pending Approval'], stats.productOrders.breakdown['Rejected']],
            backgroundColor: ['#10b981','#f59e0b', '#ef4444'],
            borderRadius: 4,
            barThickness: 30,
        }],
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: false } },
        scales: { 
            y: { beginAtZero: true, grid: { borderDash: [4, 4], drawBorder: false }, ticks: { font: { size: 10, family: "inherit" }, padding: 8 } }, 
            x: { grid: { display: false }, ticks: { font: { size: 11, family: "inherit" } } } 
        }
    };

    const pageStyle = { display: 'flex', minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }; 
    const contentStyle = { 
        marginLeft: isMobile ? '0' : '240px', 
        width: isMobile ? '100%' : 'calc(100% - 240px)', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out'
    };
    const topNavStyle = {
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', padding: '0 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, height: '64px', boxSizing: 'border-box', gap: '16px'
    };
    const mainContainerStyle = activeView !== 'home' ? {
        flex: 1, width: '100%', overflow: 'hidden', position: 'relative'
    } : {
        padding: '24px', maxWidth: '100%', margin: '0 auto', width: '100%', boxSizing: 'border-box'
    };

    const UI_HEIGHT = '36px';

    const actionButtonStyle = (bg, color) => ({
        background: bg, color: color, border: 'none', height: UI_HEIGHT, padding: '0 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    });

    const navBtnStyle = { ...actionButtonStyle('white', '#334155'), border: '1px solid #cbd5e1', gap: '8px', padding: '0 12px' };

    const inputStyle = {
        height: UI_HEIGHT, padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', width: '100px', boxSizing: 'border-box', transition: 'border-color 0.2s', color: '#334155'
    };

    const TickerItems = () => (
        <>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("News 1"); }} className="ticker-link">📢 New Holiday Schedule</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("News 2"); }} className="ticker-link">⚡ System Maintenance Sunday</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("News 3"); }} className="ticker-link">🎉 Top Seller Announced</a>
        </>
    );

    const handleVendorSearchChange = (e) => {
        const value = e.target.value;
        setVendorSearch(value);
        if (value.length > 0) setShowSuggestions(true);
        else setShowSuggestions(false);
    };

    const selectVendorSuggestion = (vendor) => {
        setVendorSearch(vendor.name); 
        setAppliedVendorCode(vendor.userCode); 
        setShowSuggestions(false); 
    };

    return (
        <div style={pageStyle}>
            <style>
                {`
                    @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    .ticker-container { flex: 1; min-width: 150px; max-width: 500px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; height: ${UI_HEIGHT}; display: flex; align-items: center; position: relative; }
                    .ticker-mask { width: 100%; overflow: hidden; white-space: nowrap; mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
                    .ticker-content { display: inline-flex; animation: ticker-scroll 35s linear infinite; }
                    .ticker-content:hover { animation-play-state: paused; }
                    .ticker-set { display: flex; align-items: center; padding-right: 50px; }
                    .ticker-link { color: #475569; text-decoration: none; margin: 0 16px; font-weight: 500; font-size: 12px; line-height: ${UI_HEIGHT}; }
                    .ticker-link:hover { text-decoration: underline; color: #2563eb; }
                    @keyframes badge-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                    .nav-btn:hover { background-color: #f1f5f9 !important; border-color: #94a3b8 !important; }
                    @media (max-width: 1550px) { .nav-btn-text { display: none; } .mobile-badge { display: inline-block !important; margin-left: 4px; font-size: 11px; font-weight: 700; color: #ef4444; } }
                    @media (max-width: 768px) { .ticker-container { display: none; } }
                    .loader-pulse { animation: pulse 1.5s infinite ease-in-out; }
                `}
            </style>
            
            <Sidebar setView={handleViewSwitch} activeView={activeView} userRole={user.role} isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div style={contentStyle}>
                
                <div style={topNavStyle}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#334155', padding:'0'}}>☰</button>}
                        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {activeView === 'home' ? 'Dashboard' : activeView.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h2>
                    </div>
                    
                    <div className="ticker-container"><div className="ticker-mask"><div className="ticker-content"><div className="ticker-set"><TickerItems /></div><div className="ticker-set"><TickerItems /></div></div></div></div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openPdf('privacy')} style={navBtnStyle} className="nav-btn" title="Privacy Policy">📄 <span className="nav-btn-text">Privacy Policy</span>{isRecent(user.documents?.privacyPolicyDate) && <NewBadge />}</button>
                            <button onClick={() => openPdf('discount')} style={navBtnStyle} className="nav-btn" title="Discount Structure">🏷️ <span className="nav-btn-text">Discount Structure</span>{isRecent(user.documents?.discountStructureDate) && <NewBadge />}</button>
                            <button onClick={() => openPdf('ledger')} style={navBtnStyle} className="nav-btn" title="Account Ledger">📒 <span className="nav-btn-text">Account Ledger</span>{isRecent(user.documents?.accountLedgerDate) && <NewBadge />}</button>
                        </div>
                        <div style={{width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px'}}></div>

                        {(user.role === 'admin' || user.role === 'god') && (
                            <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                {user.role === 'god' && <input type="text" placeholder="Group..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} style={inputStyle}/>}
                                
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Vendor..." 
                                        value={vendorSearch} 
                                        onChange={handleVendorSearchChange}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        onFocus={() => vendorSearch && setShowSuggestions(true)}
                                        style={inputStyle}
                                    />
                                    {showSuggestions && vendorSuggestions.length > 0 && (
                                        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, listStyle: 'none', padding: 0, margin: '4px 0 0 0', textAlign: 'left', minWidth: '160px'}}>
                                            {vendorSuggestions.map((vendor) => (
                                                <li key={vendor._id} onClick={() => selectVendorSuggestion(vendor)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#333', fontSize: '13px' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
                                                    <strong>{vendor.name}</strong> <span style={{color:'#888', fontSize:'11px'}}>({vendor.userCode})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <button onClick={() => { setAppliedVendorCode(vendorSearch); setAppliedGroup(groupSearch); }} style={{...actionButtonStyle('#3b82f6', 'white'), padding: '0 12px'}}>Go</button>
                                {(appliedVendorCode || appliedGroup) && <button onClick={handleReset} style={{...actionButtonStyle('#ef4444', 'white'), padding: '0 10px'}}>✕</button>}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setActiveView('cart')} style={navBtnStyle} className="nav-btn" title="Cart">🛒 <span className="nav-btn-text" style={{ background: '#ef4444', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', marginLeft:'4px' }}>{cart.length}</span><span style={{ display: 'none' }} className="mobile-badge">{cart.length}</span></button>
                            <button onClick={() => {
                                localStorage.removeItem('token'); 
                                setToken(null);
                            }} style={{...actionButtonStyle('#fff1f2', '#e11d48'), border: '1px solid #fecdd3'}}>Logout</button>
                        </div>
                    </div>
                </div>

                <div style={mainContainerStyle}>
                    <Suspense fallback={<ViewLoader />}>
                        {activeView === 'home' && user.role !== 'sub' && (
                            <div>
                                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div><h1 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>Welcome back, {user.name} 👋</h1><p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Here's what's happening with your dealership today.</p></div>
                                    <FilterBar onReset={handleReset}>
                                        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={{ padding: '0 12px', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', background: 'white', color: '#334155', fontWeight: '500', fontSize: '12px' }}>
                                            <option value="this_month">This Month</option><option value="last_month">Last Month</option><option value="custom">Custom Range</option>
                                        </select>
                                        {timeFilter === 'custom' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', height: '36px' }}>
                                                <input type="date" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} style={{ border: 'none', outline: 'none', fontSize: '11px', color: '#334155' }} /><span style={{ color: '#94a3b8', fontSize: '11px' }}>to</span><input type="date" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} style={{ border: 'none', outline: 'none', fontSize: '11px', color: '#334155' }} />
                                            </div>
                                        )}
                                    </FilterBar>
                                </div>

                                {user.role === 'god' && vendorStatus && (
                                    <div style={{marginBottom:'20px', padding:'16px', background:'white', borderRadius:'8px', border: vendorStatus.creditLimitBreached === 'ON' ? '1px solid #ef4444' : '1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
                                        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                            <div style={{fontSize:'24px', background: vendorStatus.creditLimitBreached === 'ON' ? '#fef2f2' : '#f0fdf4', padding:'8px', borderRadius:'8px'}}>{vendorStatus.creditLimitBreached === 'ON' ? '🛑' : '✅'}</div>
                                            <div><h3 style={{margin:0, color:'#1e293b', fontSize:'14px', fontWeight: '600'}}>Credit Limit Enforcement</h3><div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>Vendor: <strong style={{color:'#334155'}}>{vendorStatus.name}</strong> ({vendorStatus.userCode}) | Status: <strong style={{color: vendorStatus.creditLimitBreached === 'ON' ? '#ef4444' : '#10b981'}}>{vendorStatus.creditLimitBreached === 'ON' ? 'BREACHED' : 'NORMAL'}</strong></div></div>
                                        </div>
                                        <div><button onClick={toggleCreditLimit} style={{padding:'8px 16px', borderRadius:'6px', border:'none', background: vendorStatus.creditLimitBreached === 'ON' ? '#22c55e' : '#ef4444', color:'white', fontWeight:'600', cursor:'pointer', fontSize:'12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>{vendorStatus.creditLimitBreached === 'ON' ? 'Restore Credit' : 'Block Credit'}</button></div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                    <StatsCard title="Completed Orders" value={stats.productOrders.count} subtext={`Active Vendor: ${appliedVendorCode || 'All'}`} icon="📦" color="#10b981" />
                                    <StatsCard title="Total Revenue" value={`₹ ${stats.productOrders.revenue.toLocaleString()}`} subtext="From completed orders" icon="💰" color="#3b82f6" />
                                    <StatsCard title="Lead Win Rate" value={`${stats.leads.conversionRate}%`} subtext={`${stats.leads.won} won / ${stats.leads.total} total`} icon="📈" color="#f59e0b" />
                                    <StatsCard title="Support Tickets" value={stats.supportTickets.count} subtext="Needs attention" icon="🎫" color="#ef4444" />
                                </div>

                                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
                                    <div style={{ marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}><h3 style={{ margin: 0, color: '#1e293b', fontSize: '14px', fontWeight: '600' }}>Order Analytics</h3></div>
                                    <div style={{ height: '240px' }}><Bar options={chartOptions} data={chartData} /></div>
                                </div>
                            </div>
                        )}
                        
                        {activeView === 'products' && <div style={{ padding: '0' }}><Products key={productsRefreshKey} addToCart={addToCart} cart={cart} goToCart={() => setActiveView('cart')} notify={notify} userRole={user.role} /></div>}
                        {activeView === 'lead-product-status' && <div style={{overflowX: 'auto'}}><LeadProductStatus token={token} user={user} appliedVendorCode={appliedVendorCode} appliedGroup={appliedGroup} notify={notify} /></div>}
                        {activeView === 'product-order-status' && <div style={{overflowX: 'auto'}}><ProductOrderStatus token={token} user={user} appliedVendorCode={appliedVendorCode} appliedGroup={appliedGroup} notify={notify} /></div>}
                        {activeView === 'ticket-status' && <div style={{overflowX: 'auto'}}><SupportStatus token={token} setView={handleViewSwitch} onEdit={(item) => handleEdit('support-ticket', item)} appliedVendorCode={appliedVendorCode} appliedGroup={appliedGroup} notify={notify} /></div>}
                        
                        {activeView === 'support-ticket' && (
                            <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
                                <SupportTicketForm 
                                    token={token} 
                                    editingItem={editingItem} 
                                    setEditingItem={setEditingItem} 
                                    notify={notify}
                                    onSuccess={() => {
                                        // 🚀 Invalidate tickets when a new one is successfully submitted!
                                        queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
                                        // 2. Refresh the Dashboard Stats to show the new count!
                                        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                                        handleViewSwitch('ticket-status');

                                    }} 
                                    onCancel={() => handleViewSwitch('ticket-status')} 
                                />
                            </div>
                        )}
                        
                        {activeView === 'cart' && (
                            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                                <Cart 
                                    cart={cart} 
                                    setCart={setCart} 
                                    token={token} 
                                    onOrderSuccess={handleOrderSuccess} 
                                    notify={notify} 
                                    userRole={user.role}
                                />
                            </div>
                        )}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};
export default Dashboard;