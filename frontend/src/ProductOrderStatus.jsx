import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🚀 IMPORT REACT QUERY
import api , {BASE_URL} from './api';
import FilterBar from './FilterBar';
import TableSkeleton from './TableSkeleton';

// --- VISUAL TRACKER (STAGES ONLY) ---
const ProductionStageTracker = ({ flag, stage, history = [] }) => {
    const productionSteps = ['Under Process', 'In Production', 'Testing', 'Dispatch', 'Delivered'];
    
    const getHistoryDate = (value, type) => {
        const entry = history.slice().reverse().find(h => h.value === value && h.type === type);
        if (!entry) return null;
        return new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    if (flag === 'Rejected') {
        return (
            <div style={{marginBottom: '16px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#ef4444', textAlign: 'center', fontWeight: 'bold', display:'flex', justifyContent:'center', gap:'8px', alignItems:'center', fontSize: '13px'}}>
                 <span>❌</span> ORDER REJECTED
            </div>
        );
    }

    if (flag !== 'Ordered') return null;

    const prodStageIdx = productionSteps.indexOf(stage);

    return (
        <div style={{marginBottom: '20px', display:'flex', flexDirection:'column', gap:'10px'}}>
            <div style={{display:'flex', flexDirection:'column', gap:'4px', marginTop:'0px'}}>
                 <span style={{fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase'}}>Production Lifecycle</span>
                 <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    {productionSteps.map((prodStep, i) => {
                        const isDone = i <= prodStageIdx;
                        const isCurrent = i === prodStageIdx;
                        const dateStr = getHistoryDate(prodStep, 'stage');

                        return (
                            <div key={prodStep} style={{display:'flex', flexDirection:'column', alignItems:'center', flex:1, position:'relative'}}>
                                {i < productionSteps.length - 1 && (
                                    <div style={{
                                        position:'absolute', top:'9px', left:'50%', right:'-50%', height:'2px', 
                                        background: i < prodStageIdx ? '#10b981' : '#e2e8f0', zIndex:0
                                    }}/>
                                )}
                                <div style={{
                                    width:'20px', height:'20px', borderRadius:'50%', background: isDone ? '#10b981' : '#e2e8f0',
                                    color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold',
                                    zIndex:1, boxShadow: isCurrent ? '0 0 0 2px #bfdbfe' : 'none'
                                }}>
                                    {i < prodStageIdx ? '✓' : (i+1)}
                                </div>
                                <div style={{fontSize:'11px', color: isCurrent ? '#1e293b' : '#94a3b8', fontWeight: isCurrent ? '700' : '500', marginTop:'4px', textAlign:'center'}}>
                                    {prodStep}
                                </div>
                                {dateStr && (
                                    <div style={{fontSize:'10px', color:'#64748b', marginTop:'1px'}}>{dateStr}</div>
                                )}
                            </div>
                        );
                    })}
                 </div>
            </div>
        </div>
    );
};

const ProductOrderStatus = ({ token, user, appliedVendorCode , appliedGroup, notify }) => { 
    const queryClient = useQueryClient(); // 🚀 Hook into the cache
    
    const [viewMode, setViewMode] = useState('list'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOption, setSortOption] = useState('dateNewest'); 
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (stageName) => setExpandedSections(prev => ({ ...prev, [stageName]: !prev[stageName] }));

    // 🚀 REACT QUERY: ORDERS CACHING
    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['productOrders', appliedGroup],
        queryFn: async () => {
            // Preserving the 300ms UI smoothing delay
            const minDelay = new Promise(resolve => setTimeout(resolve, 300));
            const apiCall = api.get('/api/product-orders', {
                params : {group : appliedGroup} ,
                headers: { 'x-auth-token': token }
            });
            const [_, res] = await Promise.all([minDelay, apiCall]);
            return res.data;
        },
        enabled: !!token,
        staleTime: 1000 * 60 * 5 // Cache for 5 minutes
    });

    const flagStages = [
        { name: 'Ordered', color: '#10b981' },
        { name: 'Pending Approval', color: '#f59e0b' },
        { name: 'Rejected', color: '#ef4444' }
    ];

    const getCreatorName = (order) => { 
        if (order.subUser) { 
            if (user && (user.id === order.subUser._id || user._id === order.subUser._id)) return 'SELF'; 
            return order.subUser.name; 
        } 
        if (order.user) { 
            if (user && (user.id === order.user._id || user._id === order.user._id)) return 'SELF'; 
            return order.user.name || 'Main User'; 
        } 
        return '-'; 
    };

    const filteredOrders = orders.filter(order => {
        const lowerTerm = searchTerm ? searchTerm.toLowerCase() : '';
        const matchesSearch = !searchTerm || (
            (order.leadNumber && order.leadNumber.toLowerCase().includes(lowerTerm)) ||
            (order.productTitle && order.productTitle.toLowerCase().includes(lowerTerm)) ||
            (order.companyName && order.companyName.toLowerCase().includes(lowerTerm)) ||
            (order.notes && order.notes.toLowerCase().includes(lowerTerm))
        );
        const matchesStatus = !statusFilter || order.flag === statusFilter;
        const matchesVendor = !appliedVendorCode || 
            (order.leadNumber && order.leadNumber.toLowerCase().startsWith(appliedVendorCode.toLowerCase()));
        return matchesSearch && matchesStatus && matchesVendor;
    });

    const getSortedOrders = (orderList) => { 
        return [...orderList].sort((a, b) => { 
            if (sortOption === 'dateNewest') return new Date(b.date) - new Date(a.date); 
            if (sortOption === 'dateOldest') return new Date(a.date) - new Date(b.date); 
            if (sortOption === 'priceHighest') return (b.totalPrice || 0) - (a.totalPrice || 0); 
            if (sortOption === 'priceLowest') return (a.totalPrice || 0) - (b.totalPrice || 0); 
            return 0; 
        }); 
    };

    const renderSpecs = (specs) => { 
        if (!specs || Object.keys(specs).length === 0) return null; 
        return (
            <div style={{marginTop:'6px', fontSize:'11px', color:'#64748b', background:'#f8fafc', padding:'6px', borderRadius:'4px', border:'1px solid #f1f5f9'}}>
                {Object.entries(specs).slice(0, 3).map(([key, val]) => (
                    <div key={key}><strong>{key}:</strong> {val}</div>
                ))}
                {Object.keys(specs).length > 3 && <i style={{color:'#94a3b8'}}>...</i>}
            </div>
        ); 
    };
    
    // --- UNIFORM STYLES ---
    const headerStyle = { 
        padding: '12px 16px', 
        textAlign: 'left', 
        fontWeight: '600', 
        color: '#64748b', 
        fontSize: '11px', 
        textTransform:'uppercase',
        letterSpacing: '0.05em',
        borderRight: '1px solid #f1f5f9'
    };
    
    const cellStyle = { 
        padding: '14px 16px', 
        verticalAlign: 'top', 
        fontSize: '13px', 
        color: '#334155',
        borderBottom: '1px solid #f1f5f9'
    };
    const secondaryText = { fontSize: '12px', color: '#64748b' };
    const metaText = { fontSize: '11px', color: '#94a3b8' };

    const renderList = () => { 
        const hasOrders = filteredOrders.length > 0; 
        const colWidths = { id: '15%', created: '12%', product: '25%', client: '20%', stage: '18%', action: '10%' }; 
        
        return (
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ ...headerStyle, width: colWidths.id }}>Order ID</div>
                    <div style={{ ...headerStyle, width: colWidths.created }}>Creator</div>
                    <div style={{ ...headerStyle, width: colWidths.product }}>Product</div>
                    <div style={{ ...headerStyle, width: colWidths.client }}>Client</div>
                    <div style={{ ...headerStyle, width: colWidths.stage }}>Stage</div>
                    <div style={{ ...headerStyle, width: colWidths.action, borderRight:'none' }}>Action</div>
                </div>
                {!hasOrders && <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize:'13px' }}>No orders found.</div>}
                {hasOrders && flagStages.map(stage => {
                    const stageOrders = filteredOrders.filter(o => o.flag === stage.name); 
                    if (stageOrders.length === 0) return null; 
                    const sortedStageOrders = getSortedOrders(stageOrders);
                    const isExpanded = expandedSections[stage.name]; 

                    return (
                        <div key={stage.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <div 
                                onClick={() => toggleSection(stage.name)} 
                                style={{ 
                                    background: isExpanded ? '#f8fafc' : 'white', 
                                    padding: '12px 16px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    cursor: 'pointer', 
                                    userSelect: 'none', 
                                    transition: 'background 0.2s' 
                                }}
                            >
                                <div style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', fontSize: '12px', color: '#64748b' }}>▼</div>
                                <div style={{width:'8px', height:'8px', borderRadius:'50%', background: stage.color}}></div>
                                <h3 style={{ margin: 0, fontSize: '13px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                                    {stage.name} ({sortedStageOrders.length})
                                </h3>
                            </div>
                            
                            {isExpanded && (
                                <div style={{animation: 'fadeIn 0.3s'}}>
                                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {sortedStageOrders.map(order => (
                                                <tr key={order._id}>
                                                    <td style={{ ...cellStyle, width: colWidths.id }}>
                                                        <span style={{fontWeight:'600', color:'#3b82f6', fontSize:'13px'}}>{order.leadNumber}</span>
                                                    </td>
                                                    <td style={{ ...cellStyle, width: colWidths.created, ...secondaryText }}>{getCreatorName(order)}</td>
                                                    <td style={{ ...cellStyle, width: colWidths.product }}>
                                                        <strong style={{fontSize:'13px', color:'#334155'}}>{order.productTitle}</strong> <br />
                                                        <span style={secondaryText}>Qty: {order.quantity}</span>
                                                        {renderSpecs(order.specifications)}
                                                    </td>
                                                    <td style={{ ...cellStyle, width: colWidths.client }}>
                                                        <span style={{fontWeight:'600', fontSize:'13px', color:'#334155'}}>{order.companyName}</span><br />
                                                        <span style={secondaryText}>{order.location}</span>
                                                    </td>
                                                    <td style={{ ...cellStyle, width: colWidths.stage, fontSize:'12px', color: '#64748b' }}>
                                                        {order.flag === 'Ordered' ? (
                                                            <span style={{background:'#f0fdf4', color:'#166534', padding:'4px 8px', borderRadius:'4px', border:'1px solid #bbf7d0', fontWeight:'500', fontSize:'11px'}}>
                                                                {order.stage || 'Under Process'}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={{ ...cellStyle, width: colWidths.action }}>
                                                        <button onClick={() => setEditingOrder(order)} style={{ border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight:'600' }}>View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBoardColumn = (stage) => {
        const stageOrders = filteredOrders.filter(o => o.flag === stage.name); 
        const sortedStageOrders = getSortedOrders(stageOrders);
        return (
            <div key={stage.name} style={{minWidth: '280px', width: '280px', display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px'}}>
                <div style={{padding: '0 4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <strong style={{color:'#334155', fontSize:'13px'}}>{stage.name}</strong>
                    <span style={{background: stage.color, color: 'white', borderRadius:'8px', padding:'2px 8px', fontSize:'11px', fontWeight: 'bold'}}>{sortedStageOrders.length}</span>
                </div>
                <div style={{flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {sortedStageOrders.map(order => (
                        <div key={order._id} style={{background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'transform 0.2s'}}>
                            <div style={{marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems: 'flex-start'}}>
                                <strong style={{fontSize:'11px', color:'#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px'}}>{order.leadNumber}</strong>
                                <small style={{color:'#94a3b8', fontSize: '11px'}}>{order.date ? new Date(order.date).toLocaleDateString() : ''}</small>
                            </div>
                            <div style={{fontSize:'13px', color:'#1e293b', fontWeight:'600', marginBottom:'4px'}}>{order.productTitle}</div>
                            <div style={{fontSize:'12px', color:'#64748b', marginBottom:'8px'}}>{order.companyName}</div>
                            {renderSpecs(order.specifications)}
                            
                            {order.flag === 'Ordered' && (
                                <div style={{marginTop:'8px', fontSize:'11px', background:'#f0fdf4', padding:'6px', borderRadius:'4px', color:'#166534', fontWeight:'600', textAlign:'center', border:'1px solid #dcfce7'}}>
                                    {order.stage || 'Under Process'}
                                </div>
                            )}

                            <div style={{marginTop:'12px', borderTop:'1px solid #f1f5f9', paddingTop:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span style={{fontSize:'13px', fontWeight:'700', color:'#059669'}}>₹ {order.totalPrice}</span>
                                <span style={{fontSize:'11px', color:'#94a3b8'}}>👤 {getCreatorName(order)}</span>
                            </div>
                            {order.notes && (<div style={{fontSize:'11px', background:'#fff7ed', padding:'8px', borderRadius:'4px', marginTop:'8px', color:'#c2410c', border: '1px solid #ffedd5'}}>📝 {order.notes}</div>)}
                            <button onClick={() => setEditingOrder(order)} style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', background:'white', color:'#334155', borderRadius:'4px', cursor:'pointer', fontSize:'12px', marginTop:'12px', fontWeight:'600'}}>View / Edit</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', background: 'white' };

    return (
        <div style={{padding:'30px', height: '100%', display:'flex', flexDirection:'column'}}>
            <FilterBar viewMode={viewMode} setViewMode={setViewMode}>
                <input type="text" placeholder="🔍 Search Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, width: '200px'}}/>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                    <option value="">All Statuses</option>
                    {flagStages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{...inputStyle, fontWeight:'600', color: '#475569'}}>
                    <option value="dateNewest">📅 Newest First</option>
                    <option value="dateOldest">📅 Oldest First</option>
                    <option value="priceHighest">💰 Price: High to Low</option>
                    <option value="priceLowest">💰 Price: Low to High</option>
                </select>
            </FilterBar>

            <div style={{flex:1, overflowY:'auto', marginTop: '20px'}}>
                {loading ? <TableSkeleton/> : ( 
                    viewMode === 'list' ? renderList() : (
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', height: '100%', alignItems: 'flex-start', paddingBottom: '10px' }}>
                        {flagStages.map(stage => renderBoardColumn(stage))}
                    </div>
                )
            )}
            </div>
            
            {/* 🚀 MAGIC: Injecting cache invalidation directly into the modal's onRefresh */}
            {editingOrder && (
                <EditOrderModal 
                    order={editingOrder} 
                    token={token} 
                    user={user} 
                    onClose={() => setEditingOrder(null)} 
                    onRefresh={() => {
                        queryClient.invalidateQueries({ queryKey: ['productOrders'] });
                        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                    }} 
                    flagOptions={flagStages.map(s => s.name)} 
                    notify={notify}
                />
            )}
            <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
        </div>
    );
};

const EditOrderModal = ({ order, token, user, onClose, onRefresh, flagOptions, notify }) => {
    const isRejected = order.flag === 'Rejected';
    const [formData, setFormData] = useState({
        notes: order.notes || '',
        flag: order.flag,
        expectedRequiredDate: order.expectedRequiredDate ? order.expectedRequiredDate.split('T')[0] : '',
        expectedDispatchDate: order.expectedDispatchDate ? order.expectedDispatchDate.split('T')[0] : '',
        stage: order.stage || 'Under Process',
        companyName: order.companyName || '',
        phone: order.phone || '',
        email: order.email || '',
        location: order.location || '',
        productTitle: order.productTitle || '',
        quantity: order.quantity || 0,
        totalPrice: order.totalPrice || 0,
        keptAttachments: order.attachments || []
    });

    const [drawingFile, setDrawingFile] = useState(null);
    const [commercialFile, setCommercialFile] = useState(null);
    const [technicalOfferFile, setTechnicalOfferFile] = useState(null);
    const [adminDocFile, setAdminDocFile] = useState(null);
    const [newFiles, setNewFiles] = useState([]);
    const [specList, setSpecList] = useState(() => {
        if (!order.specifications) return [];
        return Object.entries(order.specifications).map(([key, value]) => ({ key, value }));
    });

    const isAdmin = user && ['admin', 'god'].includes(user.role);
    const canEditNotes = isAdmin || ['Pending Approval', 'Rejected'].includes(order.flag);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'quantity') {
                const qty = parseFloat(value) || 0;
                const unit = parseFloat(order.unitPrice) || 0;
                if (unit > 0) newData.totalPrice = qty * unit;
            }
            return newData;
        });
    };

    const handleSpecValueChange = (index, newValue) => {
        const updated = [...specList];
        updated[index].value = newValue; 
        setSpecList(updated);
    };

    const handleFileSelect = (e) => setNewFiles([...newFiles, ...Array.from(e.target.files)]);
    const removeExistingAttachment = (index) => setFormData(prev => ({ ...prev, keptAttachments: prev.keptAttachments.filter((_, i) => i !== index) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            if (isAdmin) {
                data.append('flag', formData.flag);
                data.append('expectedDispatchDate', formData.expectedDispatchDate);
                data.append('stage', formData.stage);
                if (adminDocFile) data.append('adminDoc', adminDocFile);
            }
            data.append('notes', formData.notes);
            data.append('expectedRequiredDate', formData.expectedRequiredDate);
            
            if (isRejected) {
                data.append('companyName', formData.companyName);
                data.append('phone', formData.phone);
                data.append('email', formData.email);
                data.append('location', formData.location);
                data.append('quantity', formData.quantity);
                data.append('totalPrice', formData.totalPrice);
                
                const specsObject = {};
                specList.forEach(item => { if(item.key.trim()) specsObject[item.key] = item.value; });
                data.append('specifications', JSON.stringify(specsObject));
                data.append('keptAttachments', JSON.stringify(formData.keptAttachments));
                newFiles.forEach(file => data.append('newAttachments', file));
            }

            if (drawingFile) data.append('drawing', drawingFile);
            if (commercialFile) data.append('commercial', commercialFile);
            if (technicalOfferFile) data.append('technicalOffer', technicalOfferFile);

            await api.put(`/api/product-orders/${order._id}`, data, {
                headers: { 'x-auth-token': token , 'Content-Type': 'multipart/form-data'}
            });
            if(notify) notify('Order updated successfully!', 'success');
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.msg || 'Error updating order';
            if(notify) notify(msg, 'error');
        }
    };

    const ReadOnlySection = ({ title, children }) => (
        <div style={{marginBottom:'12px', padding:'12px', background:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:'10px', fontWeight:'700', color:'#94a3b8', marginBottom:'6px', textTransform:'uppercase'}}>{title}</div>
            <div style={{fontSize:'13px', color:'#334155'}}>{children}</div>
        </div>
    );

    const inputStyle = { width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1', boxSizing:'border-box', marginBottom:'8px', fontSize:'13px', outline:'none' };
    const labelStyle = { display:'block', marginBottom:'4px', fontWeight:'600', fontSize:'12px', color:'#64748b' };

    const renderAdminFileInput = (label, fileState, setFileState, currentUrl) => (
        <div style={{marginBottom:'8px', fontSize:'11px'}}>
            <label style={{display:'block', fontWeight:'600', marginBottom:'3px', color:'#1e40af'}}>{label} (PDF)</label>
            {currentUrl && (
                <div style={{marginBottom:'3px'}}>
                    <a href={`${BASE_URL}/${currentUrl}`} target="_blank" rel="noopener noreferrer" style={{color:'#3b82f6'}}>View Current</a>
                </div>
            )}
            <input type="file" accept="application/pdf" onChange={(e) => setFileState(e.target.files[0])} style={{fontSize:'11px'}}/>
        </div>
    );

    return (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(15, 23, 42, 0.65)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}>
            <div style={{background:'white', padding:'24px', borderRadius:'12px', width:'750px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:'1px solid #e2e8f0', paddingBottom:'12px'}}>
                    <h3 style={{margin:0, fontSize:'20px', color:'#1e293b'}}>Edit Order: {order.leadNumber}</h3>
                    <button onClick={onClose} style={{background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#94a3b8'}}>×</button>
                </div>
                <ProductionStageTracker flag={formData.flag} stage={formData.stage} history={order.statusHistory} />
                <form onSubmit={handleSubmit} style={{display:'flex', gap:'25px'}}>
                    <div style={{flex:1}}>
                        {/* LEFT COLUMN - Product & Client */}
                        {isRejected ? (
                            <div style={{marginBottom:'16px', padding:'12px', border:'1px solid #fed7aa', borderRadius:'6px', background:'#fff7ed'}}>
                                <div style={{color:'#c2410c', fontWeight:'bold', marginBottom:'12px', fontSize:'11px', display:'flex', alignItems:'center', gap:'4px'}}><span>✏️</span> EDITING REJECTED ORDER</div>
                                <div style={{marginBottom:'12px'}}>
                                    <label style={labelStyle}>Product Title (Read-Only)</label>
                                    <div style={{padding:'8px', background:'#f1f5f9', borderRadius:'4px', color:'#64748b', border:'1px solid #e2e8f0', fontSize:'13px'}}>{formData.productTitle}</div>
                                </div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <div style={{flex:1}}><label style={labelStyle}>Quantity</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} style={inputStyle} /></div>
                                    <div style={{flex:1}}><label style={labelStyle}>Total Price</label><input type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} style={inputStyle} /></div>
                                </div>
                                <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'4px'}}>Unit Price (Fixed): ₹ {order.unitPrice}</div>
                            </div>
                        ) : (
                            <ReadOnlySection title="Product Details">
                                <div style={{fontSize:'14px', fontWeight:'700', color:'#1e293b', marginBottom:'4px'}}>{order.productTitle}</div>
                                <div style={{color:'#475569', fontSize:'13px'}}>Qty: <strong>{order.quantity}</strong> | Total: <strong>₹ {order.totalPrice}</strong></div>
                            </ReadOnlySection>
                        )}

                         {isRejected ? (
                            <div style={{marginBottom:'16px', padding:'12px', border:'1px solid #fed7aa', borderRadius:'6px', background:'#fff7ed'}}>
                                <div style={{marginBottom:'8px'}}><label style={labelStyle}>Company Name</label><input name="companyName" value={formData.companyName} onChange={handleChange} style={inputStyle} /></div>
                                <div style={{marginBottom:'8px'}}><label style={labelStyle}>Email</label><input name="email" value={formData.email} onChange={handleChange} style={inputStyle} /></div>
                                <div style={{marginBottom:'8px'}}><label style={labelStyle}>Phone</label><input name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Location</label><input name="location" value={formData.location} onChange={handleChange} style={inputStyle} /></div>
                            </div>
                        ) : (
                             <ReadOnlySection title="Client Info">
                                <div style={{fontWeight:'600', color:'#334155'}}>{order.companyName}</div>
                                <div style={{color:'#64748b', fontSize:'12px'}}>{order.email}</div>
                                <div style={{color:'#64748b', fontSize:'12px'}}>{order.phone}</div>
                                <div style={{color:'#64748b', fontSize:'12px'}}>{order.location}</div>
                            </ReadOnlySection>
                        )}
                        
                        {/* SPECIFICATIONS */}
                        {isRejected ? (
                            <div style={{marginBottom:'16px', padding:'12px', border:'1px solid #fed7aa', borderRadius:'6px', background:'#fff7ed'}}>
                                <label style={{...labelStyle, marginBottom:'8px'}}>Specifications (Values Only)</label>
                                {specList.map((item, idx) => (
                                    <div key={idx} style={{display:'flex', gap:'6px', marginBottom:'6px'}}>
                                        <input value={item.key} readOnly style={{flex:1, padding:'6px', background:'#e2e8f0', color:'#64748b', border:'1px solid #cbd5e1', borderRadius:'4px', fontSize:'12px'}} />
                                        <input value={item.value} onChange={(e) => handleSpecValueChange(idx, e.target.value)} style={{flex:1, padding:'6px', border:'1px solid #cbd5e1', borderRadius:'4px', fontSize:'12px'}} placeholder="Value"/>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ReadOnlySection title="Specifications">
                                {order.specifications && Object.entries(order.specifications).length > 0 ? (
                                    Object.entries(order.specifications).map(([k, v]) => (
                                        <div key={k} style={{marginBottom:'2px', fontSize:'12px'}}><span style={{fontWeight:'600', color:'#64748b'}}>{k}:</span> {v}</div>
                                    ))
                                ) : (
                                    <span style={{fontStyle:'italic', color:'#94a3b8'}}>No specifications.</span>
                                )}
                            </ReadOnlySection>
                        )}
                        
                        {/* Attachments Section */}
                        {isAdmin && (
                            <div style={{marginBottom:'16px', padding:'12px', border:'1px dashed #3b82f6', borderRadius:'6px', background:'#eff6ff'}}>
                                <div style={{color:'#1e40af', fontWeight:'700', marginBottom:'10px', fontSize:'11px', textTransform:'uppercase'}}>Documents (Admin)</div>
                                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                    {renderAdminFileInput('Drawing', drawingFile, setDrawingFile, order.drawing)}
                                    {renderAdminFileInput('Commercial', commercialFile, setCommercialFile, order.commercial)}
                                    {renderAdminFileInput('Tech Offer', technicalOfferFile, setTechnicalOfferFile, order.technicalOffer)}
                                    {formData.flag === 'Ordered' && (<div style={{marginTop:'8px', paddingTop:'8px', borderTop:'1px dashed #93c5fd'}}>{renderAdminFileInput('Final Order Doc (Admin)', adminDocFile, setAdminDocFile, order.adminDoc)}</div>)}
                                </div>
                            </div>
                        )}
                        
                        {!isRejected ? (
                            <ReadOnlySection title="Attachments">
                                {order.attachments && order.attachments.length > 0 ? (order.attachments.map((path, i) => (<div key={i} style={{marginBottom:'4px'}}><a href={`${BASE_URL}/${path}`} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', fontSize: '12px', textDecoration:'none'}}>📎 Attachment {i+1}</a></div>))) : 'No files attached'}
                                {!isAdmin && order.adminDoc && (<div style={{marginTop:'8px', borderTop:'1px solid #e2e8f0', paddingTop:'6px'}}><a href={`${BASE_URL}/${order.adminDoc}`} target="_blank" rel="noopener noreferrer" style={{color: '#059669', fontSize: '12px', textDecoration:'none', fontWeight:'bold'}}>📄 View Order Document</a></div>)}
                            </ReadOnlySection>
                        ) : (
                            <div style={{marginBottom:'16px', padding:'12px', border:'1px solid #fed7aa', borderRadius:'6px', background:'#fff7ed'}}>
                                <label style={{...labelStyle, marginBottom:'8px'}}>Attachments</label>
                                <input type="file" multiple onChange={handleFileSelect} style={{fontSize:'12px'}} />
                            </div>
                        )}
                    </div>

                    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                         {/* RIGHT COLUMN - Status & Notes */}
                        <div style={{marginBottom:'20px'}}>
                            <label style={labelStyle}>Flag Status</label>
                            {isAdmin ? (
                                <select name="flag" value={formData.flag} onChange={handleChange} style={inputStyle}>
                                    {flagOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <div style={{padding:'10px', background:'#f1f5f9', borderRadius:'6px', color:'#475569', border:'1px solid #cbd5e1', fontSize:'13px', fontWeight:'500'}}>
                                    {formData.flag} <span style={{fontSize:'11px', color:'#94a3b8', marginLeft:'6px'}}>(Locked)</span>
                                </div>
                            )}
                        </div>

                        {isAdmin && formData.flag === 'Ordered' && (
                            <div style={{marginBottom:'20px', animation:'fadeIn 0.5s'}}>
                                <label style={labelStyle}>Production Stage (Admin)</label>
                                <select name="stage" value={formData.stage} onChange={handleChange} style={{...inputStyle, background:'#f0fdf4', borderColor:'#86efac', fontWeight:'600', color:'#166534'}}>
                                    {['Under Process', 'In Production', 'Testing', 'Dispatch', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                        
                        <div style={{marginBottom:'20px'}}>
                            <label style={labelStyle}>Expected Required Date</label>
                            <input type="date" name="expectedRequiredDate" value={formData.expectedRequiredDate} onChange={handleChange} disabled={!canEditNotes} style={{...inputStyle, background: canEditNotes ? 'white' : '#f1f5f9'}} />
                        </div>

                        {isAdmin && (
                            <div style={{marginBottom:'20px'}}>
                                <label style={{...labelStyle, color:'#1e40af'}}>Expected Dispatch Date (Admin)</label>
                                <input type="date" name="expectedDispatchDate" value={formData.expectedDispatchDate} onChange={handleChange} style={inputStyle} />
                            </div>
                        )}

                        <div style={{marginBottom:'20px', flex:1}}>
                            <label style={labelStyle}>Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} disabled={!canEditNotes} placeholder={!canEditNotes ? "Locked." : "Add order notes here..."} style={{width:'100%', padding:'12px', borderRadius:'6px', border: canEditNotes ? '1px solid #cbd5e1' : '1px solid #e2e8f0', background: canEditNotes ? 'white' : '#f8fafc', resize:'none', height:'180px', boxSizing:'border-box', fontFamily:'inherit', fontSize:'13px', outline: 'none'}}/>
                        </div>

                        <div style={{marginTop:'auto'}}>
                            <button type="submit" disabled={!canEditNotes && !isAdmin && !isRejected} style={{width:'100%', padding:'12px', background: (!canEditNotes && !isAdmin && !isRejected) ? '#94a3b8' : '#10b981', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'13px', opacity: (!canEditNotes && !isAdmin && !isRejected) ? 0.7 : 1, transition: 'all 0.2s'}}>Save Changes</button>
                        </div>
                    </div>
                </form>
            </div>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
};

export default ProductOrderStatus;