import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🚀 IMPORT REACT QUERY
import api , {BASE_URL} from './api';
import FilterBar from './FilterBar'; 
import TableSkeleton from './TableSkeleton';

// --- SKELETON LOADER ---
// --- PIPELINE TRACKER ---
const LeadPipelineTracker = ({ currentStatus, history = [] }) => {
    const steps = ['Filtration', 'Qualified', 'Under Discussion', 'Quoted', 'Negotiation', 'Won'];
    const currentIdx = steps.indexOf(currentStatus);
    const isLost = currentStatus === 'Lost';

    const getStatusDate = (stepName) => {
        const entry = history.slice().reverse().find(h => h.status === stepName);
        if (!entry) return null;
        return new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    if (isLost) {
        return (
            <div style={{marginBottom: '20px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#ef4444', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px'}}>
                <span>❌</span> Lead Status: LOST
            </div>
        );
    }

    return (
        <div style={{marginBottom: '20px', padding: '5px 0', overflowX: 'auto'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '100%'}}>
                {steps.map((step, i) => {
                    const isCompleted = i < currentIdx || currentStatus === 'Won';
                    const isActive = i === currentIdx && currentStatus !== 'Won';
                    const dateStr = getStatusDate(step);
                    
                    let circleColor = isCompleted ? '#10b981' : (isActive ? '#3b82f6' : '#e2e8f0');
                    let textColor = isActive ? '#1e293b' : '#94a3b8';
                    let fontWeight = isActive ? '700' : '500';

                    return (
                        <div key={step} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1}}>
                            {i < steps.length - 1 && (
                                <div style={{
                                    position: 'absolute', top: '12px', left: '50%', right: '-50%', 
                                    height: '2px', background: i < currentIdx ? '#10b981' : '#f1f5f9', 
                                    zIndex: 0
                                }} />
                            )}
                            <div style={{
                                width: '26px', height: '26px', borderRadius: '50%', 
                                background: circleColor, color: 'white', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold',
                                zIndex: 1, border: isActive ? '3px solid #bfdbfe' : '2px solid white',
                                boxShadow: isActive ? '0 0 0 1px #3b82f6' : 'none',
                                transition: 'all 0.3s'
                            }}>
                                {isCompleted ? '✓' : (i + 1)}
                            </div>
                            <div style={{marginTop: '6px', fontSize: '10px', color: textColor, fontWeight: fontWeight, textAlign: 'center', maxWidth: '70px', lineHeight: '1.2'}}>
                                {step}
                            </div>
                            {dateStr && (
                                <div style={{marginTop: '2px', fontSize: '9px', color: '#64748b', textAlign: 'center'}}>
                                    {dateStr}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- TIMELINE ---
const TimelineView = ({ timeline }) => {
    if (!timeline || timeline.length === 0) return null;
    return (
        <div style={{marginTop: '15px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
            <h4 style={{marginTop: 0, marginBottom: '10px', color: '#334155', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <span>⏱️</span> Activity Timeline
            </h4>
            <div style={{maxHeight: '150px', overflowY: 'auto', paddingRight: '5px'}}>
                {timeline.slice().reverse().map((entry, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px'}}>
                        <div style={{minWidth: '65px', color: '#94a3b8', fontSize: '10px', textAlign: 'right', lineHeight: '1.2'}}>
                            {new Date(entry.timestamp).toLocaleDateString()}<br/>
                            {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div style={{flex: 1, paddingLeft: '12px', borderLeft: '2px solid #e2e8f0', position: 'relative'}}>
                            <div style={{position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1'}}></div>
                            <div style={{fontWeight: '600', color: '#1e293b'}}>
                                {entry.userName} <span style={{fontWeight: 'normal', color: '#64748b', fontSize: '10px'}}>({entry.userRole})</span>
                            </div>
                            <div style={{color: '#475569', marginTop: '2px'}}>{entry.details || entry.action}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- LEADS TABLE (DESIGN FIX APPLIED) ---
const LeadsTable = ({ leads, expandedGroups, toggleGroup, sortOption, getCreatorName, pipelineStages, renderAllDocuments, renderSpecs, renderActionButtons, colWidths, isAdmin }) => {
    const getGroupId = (leadNumber) => {
        if (!leadNumber) return 'Unknown';
        const parts = leadNumber.split('-');
        if (parts.length >= 3) return parts.slice(0, 3).join('-');
        return leadNumber;
    };

    const getGroupStatus = (leads) => {
        if (!leads || leads.length === 0) return 'Filtration';
        const hierarchy = ['Filtration', 'Qualified', 'Under Discussion', 'Quoted', 'Negotiation', 'Won', 'Lost'];
        let minIndex = hierarchy.length - 1; 
        leads.forEach(lead => {
            const idx = hierarchy.indexOf(lead.status);
            if (idx !== -1 && idx < minIndex) minIndex = idx;
        });
        return hierarchy[minIndex];
    };

    const getSortedLeads = (leadsList) => {
        return [...leadsList].sort((a, b) => {
            if (sortOption === 'dateNewest') return new Date(b.date) - new Date(a.date);
            if (sortOption === 'dateOldest') return new Date(a.date) - new Date(b.date);
            if (sortOption === 'priceHighest') return (b.totalPrice || 0) - (a.totalPrice || 0);
            if (sortOption === 'priceLowest') return (a.totalPrice || 0) - (b.totalPrice || 0);
            return 0;
        });
    };

    const groupsObj = {};
    leads.forEach(lead => {
        const gid = getGroupId(lead.leadNumber);
        if (!groupsObj[gid]) groupsObj[gid] = [];
        groupsObj[gid].push(lead);
    });

    let groupsArray = Object.entries(groupsObj).map(([groupId, groupLeads]) => {
        const sortedItems = getSortedLeads(groupLeads);
        const totalPrice = sortedItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
        const totalQuantity = sortedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const groupStatus = getGroupStatus(sortedItems);
        const dates = sortedItems.map(i => new Date(i.date).getTime());
        return { groupId, leads: sortedItems, totalPrice, totalQuantity, groupStatus, maxDate: Math.max(...dates), minDate: Math.min(...dates), representative: sortedItems[0] };
    });

    groupsArray.sort((a, b) => {
        if (sortOption === 'dateNewest') return b.maxDate - a.maxDate;
        if (sortOption === 'dateOldest') return a.minDate - b.minDate;
        if (sortOption === 'priceHighest') return b.totalPrice - a.totalPrice;
        if (sortOption === 'priceLowest') return a.totalPrice - b.totalPrice;
        return 0;
    });

    const cellStyle = { padding: '14px 16px', fontSize: '13px', color: '#334155', verticalAlign: 'top', borderBottom:'1px solid #f1f5f9' };
    const secondaryText = { fontSize: '12px', color: '#64748b' };
    const metaText = { fontSize: '11px', color: '#94a3b8' };

    if (groupsArray.length === 0) {
        return <div style={{padding:'30px', textAlign:'center', color:'#94a3b8', fontStyle:'italic', fontSize:'13px'}}>No leads in this stage.</div>;
    }

    return (
        <table style={{width:'100%', tableLayout: 'fixed', borderCollapse:'collapse'}}>
            <tbody>
                {groupsArray.map(({ groupId, leads, representative, totalPrice, totalQuantity, groupStatus }) => {
                    const isExpanded = expandedGroups[groupId];
                    const statusColor = pipelineStages.find(s=>s.name === groupStatus)?.color || '#94a3b8';
                    return (
                        <React.Fragment key={groupId}>
                            <tr onClick={() => toggleGroup(groupId)} style={{background: isExpanded ? '#f8fafc' : 'white', cursor:'pointer', transition: 'background 0.2s'}}>
                                <td style={{...cellStyle, width: colWidths.id}}>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <span style={{fontSize:'12px', color:'#94a3b8', transition:'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}}>▶</span>
                                        <strong style={{fontSize:'13px', color:'#1e293b'}}>{groupId}</strong>
                                        <span style={{background:'#e2e8f0', color:'#475569', borderRadius:'12px', padding:'1px 8px', fontSize:'11px', fontWeight:'600'}}>{leads.length}</span>
                                    </div>
                                </td>
                                <td style={{...cellStyle, width: colWidths.creator, ...secondaryText}}>{getCreatorName(representative)}</td>
                                <td style={{...cellStyle, width: colWidths.product}}>
                                    <div style={metaText}>Total Qty</div>
                                    <div style={{fontWeight:'600', color:'#334155', fontSize:'13px'}}>{totalQuantity}</div>
                                </td>
                                <td style={{...cellStyle, width: colWidths.client}}>
                                    <div style={{fontWeight:'600', color:'#334155', fontSize:'13px'}}>{representative.companyName}</div>
                                    <div style={secondaryText}>{representative.email || '-'}</div>
                                </td>
                                <td style={{...cellStyle, width: colWidths.status}}>
                                    <span style={{padding:'4px 10px', borderRadius:'12px', color: 'white', fontSize:'11px', fontWeight:'600', background: statusColor, boxShadow: `0 1px 2px ${statusColor}40`}}>
                                        {groupStatus}
                                    </span>
                                </td>
                                <td style={{...cellStyle, width: colWidths.docs, ...metaText}}>Attached</td>
                                <td style={{...cellStyle, width: colWidths.total, fontWeight:'700', color:'#10b981'}}>
                                    {(isAdmin || (representative.stage || 'Pending Approval') !== 'Pending Approval') ? `₹${totalPrice.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                            {isExpanded && leads.map(lead => (
                                <tr key={lead._id} style={{background:'white'}}>
                                    <td style={{...cellStyle, width: colWidths.id, paddingLeft:'40px', ...secondaryText}}>↳ {lead.leadNumber}</td>
                                    <td style={{...cellStyle, width: colWidths.creator, ...secondaryText}}>{getCreatorName(lead)}</td>
                                    <td style={{...cellStyle, width: colWidths.product}}>
                                        <strong style={{color:'#3b82f6', fontSize:'13px'}}>{lead.productTitle}</strong> 
                                        <br/>
                                        <span style={secondaryText}>
                                            Qty: {lead.quantity} | Total: {(isAdmin || lead.stage !== 'Pending Approval') ? `₹ ${lead.totalPrice}` : '-'}
                                        </span>
                                        {renderSpecs(lead.specifications)}
                                    </td>
                                    <td style={{...cellStyle, width: colWidths.client}}>
                                        <div style={secondaryText}>{lead.companyName}</div>
                                        <div style={metaText}>{lead.location}</div>
                                    </td>
                                    <td style={{...cellStyle, width: colWidths.status}}>
                                        <span style={{padding:'2px 8px', borderRadius:'4px', color: pipelineStages.find(s=>s.name===lead.status)?.color, fontSize:'11px', border:`1px solid ${pipelineStages.find(s=>s.name===lead.status)?.color}`, fontWeight:'600'}}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td style={{...cellStyle, width: colWidths.docs}}>{renderAllDocuments(lead)}</td>
                                    <td style={{...cellStyle, width: colWidths.total}}>{renderActionButtons(lead)}</td>
                                </tr>
                            ))}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    );
};

// --- MAIN COMPONENT ---
const LeadProductStatus = ({ token, user, appliedVendorCode, appliedGroup, notify }) => { 
    const queryClient = useQueryClient(); // 🚀 Gives us power to invalidate cache
    
    const [viewMode, setViewMode] = useState('list'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOption, setSortOption] = useState('dateNewest'); 

    const [editingLead, setEditingLead] = useState(null); 
    const [expandedGroups, setExpandedGroups] = useState({});
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [leadToOrder, setLeadToOrder] = useState(null); 
    
    const isAdmin = user && ['admin', 'god'].includes(user.role);

    const [expandedStages, setExpandedStages] = useState({
        'Pending Approval': false,
        'Approved': false,
        'Not Approved': false
    });

    const toggleStage = (stageName) => {
        setExpandedStages(prev => ({ ...prev, [stageName]: !prev[stageName] }));
    };

    // 🚀 REACT QUERY: LEADS CACHING (Replaces manual fetchLeads)
    const { data: leads = [], isLoading: loading } = useQuery({
        queryKey: ['leadProducts', appliedGroup],
        queryFn: async () => {
            // Preserving your exact 300ms UI smoothness logic!
            const minDelay = new Promise(resolve => setTimeout(resolve, 300));
            const apiCall = api.get('/api/lead-products', {
                params : {group : appliedGroup},
                headers: { 'x-auth-token': token }
            });
            const [_, res] = await Promise.all([minDelay, apiCall]);
            return res.data;
        },
        enabled: !!token, // Only fetch if user is logged in
        staleTime: 1000 * 60 * 5 // Cache data for 5 minutes
    });

    const pipelineStages = [
        { name: 'Filtration', color: '#94a3b8' },
        { name: 'Qualified', color: '#3b82f6' },
        { name: 'Under Discussion', color: '#8b5cf6' },
        { name: 'Quoted', color: '#f59e0b' },
        { name: 'Negotiation', color: '#eab308' },
        { name: 'Won', color: '#10b981' },
        { name: 'Lost', color: '#ef4444' }
    ];

    const getCreatorName = (lead) => {
        if (lead.subUser) {
            if (user && (user.id === lead.subUser._id || user._id === lead.subUser._id)) return 'SELF';
            return lead.subUser.name;
        }
        if (lead.user) {
            if (user && (user.id === lead.user._id || user._id === lead.user._id)) return 'SELF';
            return lead.user.name || 'Main User';
        }
        return '-';
    };

    const filteredLeads = leads.filter(lead => {
        const lowerTerm = searchTerm ? searchTerm.toLowerCase() : '';
        const matchesSearch = !searchTerm || (
            lead.leadNumber.toLowerCase().includes(lowerTerm) ||
            lead.companyName?.toLowerCase().includes(lowerTerm) ||
            lead.productTitle?.toLowerCase().includes(lowerTerm) ||
            (lead.notes && lead.notes.toLowerCase().includes(lowerTerm))
        );
        const matchesStatus = !statusFilter || lead.status === statusFilter;
        const matchesVendor = !appliedVendorCode || 
            (lead.leadNumber && lead.leadNumber.toLowerCase().startsWith(appliedVendorCode.toLowerCase()));
        return matchesSearch && matchesStatus && matchesVendor;
    });

    const getSortedLeads = (leadsList) => {
        return [...leadsList].sort((a, b) => {
            if (sortOption === 'dateNewest') return new Date(b.date) - new Date(a.date);
            if (sortOption === 'dateOldest') return new Date(a.date) - new Date(b.date);
            if (sortOption === 'priceHighest') return (b.totalPrice || 0) - (a.totalPrice || 0);
            if (sortOption === 'priceLowest') return (a.totalPrice || 0) - (b.totalPrice || 0);
            return 0;
        });
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const handleOrderClick = (lead) => {
        setLeadToOrder(lead);
        setShowOrderModal(true);
    };

    const submitOrder = async () => {
        if (!leadToOrder) return;
        try {
            const res = await api.post('/api/product-orders/create-from-leads', 
                { leads: [leadToOrder] }, 
                { headers: { 'x-auth-token': token } }
            );
            if(notify) notify(res.data.msg, 'success'); else alert(res.data.msg);
            
            // 🚀 MAGIC: Invalidate the cache so it instantly pulls the fresh data from the server
            queryClient.invalidateQueries(['leadProducts']);
            queryClient.invalidateQueries(['dashboardStats']); // Update Dashboard revenue numbers!

            setShowOrderModal(false);
            setLeadToOrder(null);
        } catch (err) {
            console.error(err);
            if(notify) notify('Failed to place order', 'error'); else alert('Failed to place order');
        }
    };

    const renderAllDocuments = (lead) => {
        const hasDrawing = !!lead.drawing;
        const hasCommercial = !!lead.commercial;
        const hasTechOffer = !!lead.technicalOffer;
        const hasUserFiles = lead.attachments && lead.attachments.length > 0;
        const noFiles = !hasDrawing && !hasCommercial && !hasTechOffer && !hasUserFiles;

        if (noFiles) return <span style={{color:'#cbd5e1', fontSize:'11px', fontStyle:'italic'}}>No Attachments</span>;

        return (
            <div style={{display:'flex', flexDirection:'column', gap:'4px', fontSize:'11px'}}>
                {hasDrawing && <a href={`${BASE_URL}/${lead.drawing}`} target="_blank" rel="noopener noreferrer" style={{color: '#f59e0b', textDecoration:'none', fontWeight:'500'}}>📄 Drawing</a>}
                {hasCommercial && <a href={`${BASE_URL}/${lead.commercial}`} target="_blank" rel="noopener noreferrer" style={{color: '#f59e0b', textDecoration:'none', fontWeight:'500'}}>📄 Commercial</a>}
                {hasTechOffer && <a href={`${BASE_URL}/${lead.technicalOffer}`} target="_blank" rel="noopener noreferrer" style={{color: '#f59e0b', textDecoration:'none', fontWeight:'500'}}>📄 Tech Offer</a>}
                {(hasDrawing || hasCommercial || hasTechOffer) && hasUserFiles && <div style={{height:'1px', background:'#e2e8f0', margin:'4px 0'}}></div>}
                {hasUserFiles && lead.attachments.map((path, i) => (
                    <a key={i} href={`${BASE_URL}/${path}`} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration:'none'}}>📎 File {i+1}</a>
                ))}
            </div>
        );
    };

    const renderSpecs = (specs) => {
        if (!specs || Object.keys(specs).length === 0) return null;
        return (
            <div style={{marginTop:'6px', fontSize:'11px', color:'#64748b', background:'#f8fafc', padding:'6px', borderRadius:'4px', border: '1px solid #f1f5f9'}}>
                {Object.entries(specs).map(([key, val]) => (<div key={key} style={{marginBottom:'2px'}}><strong>{key}:</strong> {val}</div>))}
            </div>
        );
    };

    const renderActionButtons = (lead) => {
        if (lead.isOrdered) return <div style={{marginTop: '4px', textAlign: 'center', padding: '6px', background: '#f0fdf4', color: '#15803d', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #bbf7d0'}}>✅ Ordered</div>;
        return (
            <div style={{display:'flex', gap:'8px', marginTop:'6px'}}>
                <button onClick={() => setEditingLead(lead)} style={{flex:1, padding:'6px 8px', border:'1px solid #cbd5e1', background:'white', color:'#334155', borderRadius:'4px', cursor:'pointer', fontSize:'11px', fontWeight: '600'}}>Edit</button>
                {lead.status === 'Won' && <button onClick={() => handleOrderClick(lead)} style={{flex:1, padding:'6px 8px', border:'none', background:'#10b981', color:'white', borderRadius:'4px', cursor:'pointer', fontSize:'11px', fontWeight: 'bold'}}>🛒 Order</button>}
            </div>
        );
    };

    const colWidths = { id: '18%', creator: '10%', product: '25%', client: '18%', status: '12%', docs: '8%', total: '9%' };

    const renderListHeader = () => {
        const headerStyle = { 
            padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #f1f5f9'
        };
        return (
            <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ ...headerStyle, width: colWidths.id }}>Group Lead</div>
                <div style={{ ...headerStyle, width: colWidths.creator }}>Creator</div>
                <div style={{ ...headerStyle, width: colWidths.product }}>Product Info</div>
                <div style={{ ...headerStyle, width: colWidths.client }}>Client</div>
                <div style={{ ...headerStyle, width: colWidths.status }}>Status</div>
                <div style={{ ...headerStyle, width: colWidths.docs }}>Docs</div>
                <div style={{ ...headerStyle, width: colWidths.total, borderRight:'none' }}>Total</div>
            </div>
        );
    };

    const renderList = () => {
        if (filteredLeads.length === 0) {
            return (
                <div style={{padding:'40px', textAlign:'center', background:'white', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'32px', marginBottom:'8px'}}>🔍</div>
                    <div style={{color:'#64748b', fontSize:'13px'}}>No leads match your search criteria.</div>
                </div>
            );
        }

        const stages = ['Approved', 'Pending Approval', 'Not Approved'];
        
        return (
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {renderListHeader()}
                {stages.map(stage => {
                    const stageLeads = filteredLeads.filter(l => (l.stage || 'Pending Approval') === stage);
                    const isExpanded = expandedStages[stage];
                    
                    let stageColor = '#64748b'; 
                    if (stage === 'Approved') stageColor = '#10b981'; 
                    if (stage === 'Not Approved') stageColor = '#ef4444'; 
                    if (stage === 'Pending Approval') stageColor = '#f59e0b'; 

                    return (
                        <div key={stage} style={{borderBottom: '1px solid #e2e8f0'}}>
                            <div 
                                onClick={() => toggleStage(stage)}
                                style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background: isExpanded ? '#f8fafc' : 'white', userSelect: 'none', transition: 'background 0.2s' }}
                            >
                                <div style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', fontSize: '12px', color: '#64748b' }}>▼</div>
                                <div style={{width:'8px', height:'8px', borderRadius:'50%', background: stageColor}}></div>
                                <h3 style={{margin:0, fontSize:'13px', color:'#334155', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight: '600'}}>
                                    {stage} ({stageLeads.length})
                                </h3>
                            </div>
                            
                            {isExpanded && (
                                <div style={{animation: 'fadeIn 0.3s'}}>
                                    <LeadsTable 
                                        leads={stageLeads} expandedGroups={expandedGroups} toggleGroup={toggleGroup} sortOption={sortOption} getCreatorName={getCreatorName} pipelineStages={pipelineStages} renderAllDocuments={renderAllDocuments} renderSpecs={renderSpecs} renderActionButtons={renderActionButtons} colWidths={colWidths} isAdmin={isAdmin}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBoardColumn = (stage) => {
        const stageLeads = filteredLeads.filter(l => l.status === stage.name);
        const sortedStageLeads = getSortedLeads(stageLeads).reverse(); 
        return (
            <div key={stage.name} style={{minWidth: '280px', width: '280px', display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px', animation: 'fadeIn 0.5s ease'}}>
                <div style={{padding: '0 4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <strong style={{color:'#334155', fontSize:'13px'}}>{stage.name}</strong>
                    <span style={{background: stage.color, color: 'white', borderRadius:'8px', padding:'2px 8px', fontSize:'11px', fontWeight: 'bold'}}>{sortedStageLeads.length}</span>
                </div>
                <div style={{flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {sortedStageLeads.map(lead => (
                        <div key={lead._id} style={{background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'transform 0.2s'}}>
                            <div style={{marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems: 'flex-start'}}>
                                <strong style={{fontSize:'11px', color:'#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px'}}>{lead.leadNumber}</strong>
                                <small style={{color:'#94a3b8', fontSize: '11px'}}>{lead.date ? new Date(lead.date).toLocaleDateString() : ''}</small>
                            </div>
                            <div style={{fontSize:'13px', color:'#1e293b', fontWeight:'600', marginBottom:'4px'}}>{lead.productTitle}</div>
                            <div style={{fontSize:'12px', color:'#64748b', marginBottom:'8px'}}>{lead.companyName}</div>
                            
                            <div style={{marginBottom:'8px'}}>
                                <span style={{fontSize:'10px', padding:'2px 6px', borderRadius:'3px', background:'#e2e8f0', color:'#475569'}}>
                                    {lead.stage || 'Pending Approval'}
                                </span>
                            </div>

                            {renderSpecs(lead.specifications)}
                            
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9'}}>
                                <div style={{fontSize:'13px', fontWeight:'700', color:'#059669'}}>
                                    {(isAdmin || lead.stage !== 'Pending Approval') ? `₹ ${lead.totalPrice}` : 'Price: Pending'}
                                </div>
                                <div style={{fontSize:'11px', color:'#94a3b8'}}>👤 {getCreatorName(lead)}</div>
                            </div>
                            {renderActionButtons(lead)}
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
                <input type="text" placeholder="🔍 Search ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, width: '200px'}}/>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                    <option value="">All Statuses</option>
                    {pipelineStages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{...inputStyle, fontWeight:'600', color: '#475569'}}>
                    <option value="dateNewest">📅 Newest First</option>
                    <option value="dateOldest">📅 Oldest First</option>
                    <option value="priceHighest">💰 Price: High to Low</option>
                    <option value="priceLowest">💰 Price: Low to High</option>
                </select>
            </FilterBar>
            
            <div style={{flex:1, overflowY:'auto', marginTop: '20px'}}>
                {loading ? <TableSkeleton /> : (
                    viewMode === 'list' ? renderList() : (
                        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', height: '100%', alignItems: 'flex-start', paddingBottom: '10px' }}>
                            {pipelineStages.map(stage => renderBoardColumn(stage))}
                        </div>
                    )
                )}
            </div>

            {showOrderModal && leadToOrder && (
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(15, 23, 42, 0.6)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                    <div style={{background:'white', padding:'24px', borderRadius:'12px', width:'360px', display:'flex', flexDirection:'column', boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
                        <h3 style={{marginTop:0, color:'#1e293b', fontSize:'16px'}}>Confirm Order</h3>
                        <p style={{fontSize:'13px', color:'#64748b', lineHeight:'1.5', marginBottom: '16px'}}>
                            Create Product Order for <strong>{leadToOrder.leadNumber}</strong>?
                        </p>
                        <div style={{background:'#f8fafc', padding:'16px', borderRadius:'6px', marginBottom:'20px', fontSize:'13px', border: '1px solid #e2e8f0'}}>
                            <div style={{marginBottom:'4px'}}><strong>Product:</strong> {leadToOrder.productTitle}</div>
                            <div style={{marginBottom:'4px'}}><strong>Client:</strong> {leadToOrder.companyName}</div>
                            <div>
                                <strong>Total:</strong> 
                                <span style={{color:'#059669', fontWeight:'bold', marginLeft: '5px'}}>
                                    {(isAdmin || leadToOrder.stage !== 'Pending Approval') ? `₹ ${leadToOrder.totalPrice}` : '-'}
                                </span>
                            </div>
                        </div>
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                            <button onClick={() => { setShowOrderModal(false); setLeadToOrder(null); }} style={{padding:'8px 16px', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', color: '#475569', fontWeight: '600', fontSize:'13px'}}>Cancel</button>
                            <button onClick={submitOrder} style={{padding:'8px 16px', background:'#10b981', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}>Confirm & Order</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🚀 MAGIC: Pass invalidation function directly to Modal */}
            {editingLead && (
                <EditLeadModal 
                    lead={editingLead} 
                    token={token} 
                    user={user} 
                    onClose={() => setEditingLead(null)} 
                    onRefresh={() => {
                        queryClient.invalidateQueries({ queryKey: ['leadProducts'] });
                        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); // Updates the Lead Win Rate!
                    }} 
                    stages={pipelineStages} 
                    notify={notify} 
                />
            )}
    
            <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
        </div>
    );
};

const EditLeadModal = ({ lead, token, user, onClose, onRefresh, stages, notify }) => {
    const [formData, setFormData] = useState({ ...lead, keptAttachments: lead.attachments || [] });
    const [newFiles, setNewFiles] = useState([]);
    const [drawingFile, setDrawingFile] = useState(null);
    const [commercialFile, setCommercialFile] = useState(null);
    const [technicalOfferFile, setTechnicalOfferFile] = useState(null);

    const isAdmin = user && ['admin', 'god'].includes(user.role);
    const isStatusLocked = ['Pending Approval', 'Not Approved'].includes(lead.stage || 'Pending Approval');

    const [specList, setSpecList] = useState(() => {
        if (!lead.specifications) return [];
        return Object.entries(lead.specifications).map(([key, value]) => ({ key, value }));
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            const currentQty = name === 'quantity' ? (parseFloat(value) || 0) : (parseFloat(prev.quantity) || 0);
            const currentUnit = name === 'unitPrice' ? (parseFloat(value) || 0) : (parseFloat(prev.unitPrice) || 0);
            if (name === 'quantity' || name === 'unitPrice') {
                newData.totalPrice = currentQty * currentUnit;
            }
            return newData;
        });
    };

    const handleSpecValueChange = (index, newValue) => {
        const updated = [...specList];
        updated[index].value = newValue; 
        setSpecList(updated);
    };

    const handleFileSelect = (e) => setNewFiles([...e.target.files]);
    const removeExistingAttachment = (idx) => setFormData({ ...formData, keptAttachments: formData.keptAttachments.filter((_, i) => i !== idx) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            ['companyName', 'phone', 'email', 'location', 'productTitle', 'quantity', 'unitPrice', 'status', 'stage', 'notes']
                .forEach(f => data.append(f, formData[f] || ''));
            const specsObject = {};
            specList.forEach(item => { if(item.key.trim()) specsObject[item.key] = item.value; });
            data.append('specifications', JSON.stringify(specsObject));
            data.append('keptAttachments', JSON.stringify(formData.keptAttachments));
            newFiles.forEach(file => data.append('newAttachments', file));

            if (drawingFile) data.append('drawing', drawingFile);
            if (commercialFile) data.append('commercial', commercialFile);
            if (technicalOfferFile) data.append('technicalOffer', technicalOfferFile);

            await api.put(`/api/lead-products/${lead._id}`, data, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } 
            });
            if(notify) notify('Lead updated successfully!', 'success'); else alert('Lead updated!');
            onRefresh(); // 🚀 Triggers the React Query Invalidation!
            onClose();
        } catch (err) {
            console.error(err);
            if(notify) notify('Error updating lead', 'error'); else alert('Error updating lead');
        }
    };

    const renderAdminFileInput = (label, fileState, setFileState, currentUrl) => (
        <div style={{marginBottom:'8px', fontSize:'11px'}}>
            <label style={{display:'block', fontWeight:'600', marginBottom:'2px', color: '#1e293b'}}>{label} (PDF)</label>
            {currentUrl && (
                <div style={{marginBottom:'2px'}}>
                    <a href={`${BASE_URL}/${currentUrl}`} target="_blank" rel="noopener noreferrer" style={{color:'#3b82f6', textDecoration:'none'}}>View Current</a>
                </div>
            )}
            <input type="file" accept="application/pdf" onChange={(e) => setFileState(e.target.files[0])} style={{fontSize:'11px'}}/>
        </div>
    );

    const inputStyle = {width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1', boxSizing:'border-box', outline:'none', fontSize:'13px'};
    const labelStyle = {display:'block', marginBottom:'4px', fontWeight:'600', fontSize:'12px', color:'#64748b'};

    return (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(15, 23, 42, 0.65)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
            <div style={{background:'white', padding:'24px', borderRadius:'12px', width:'600px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:'1px solid #e2e8f0', paddingBottom:'12px'}}>
                    <h3 style={{margin:0, fontSize:'18px', color:'#1e293b'}}>Edit Lead: {lead.leadNumber}</h3>
                    <button onClick={onClose} style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#94a3b8'}}>×</button>
                </div>
                
                <LeadPipelineTracker currentStatus={formData.status} history={lead.statusHistory} />

                <form onSubmit={handleSubmit}>
                    <div style={{marginBottom:'16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                        <div>
                            <label style={labelStyle}>Status {isStatusLocked ? '(Locked)' : ''}</label>
                            <select 
                                name="status" value={formData.status} onChange={handleChange} disabled={isStatusLocked}
                                style={{...inputStyle, background: isStatusLocked ? '#f1f5f9' : 'white', color: isStatusLocked ? '#94a3b8' : 'inherit', cursor: isStatusLocked ? 'not-allowed' : 'pointer'}}
                            >
                                {stages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Product Title (Locked)</label>
                            <input type="text" name="productTitle" value={formData.productTitle} onChange={handleChange} readOnly={true} style={{...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed'}} />
                        </div>
                    </div>

                    <div style={{marginBottom:'16px', padding:'10px', background:'#fff7ed', borderRadius:'6px', border:'1px solid #ffedd5'}}>
                         <label style={labelStyle}>Approval Stage (Admin Only)</label>
                         <select 
                            name="stage" value={formData.stage || 'Pending Approval'} onChange={handleChange} disabled={!isAdmin}
                            style={{...inputStyle, background: isAdmin ? 'white' : '#f1f5f9', color: isAdmin ? 'inherit' : '#94a3b8', cursor: isAdmin ? 'pointer' : 'not-allowed'}}
                        >
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Approved">Approved</option>
                            <option value="Not Approved">Not Approved</option>
                         </select>
                         {!isAdmin && <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'4px'}}>* Only Administrators can change this</div>}
                    </div>

                    {user && ['admin', 'god'].includes(user.role) && (
                        <div style={{marginBottom:'16px', padding:'12px', background:'#eff6ff', border:'1px dashed #3b82f6', borderRadius:'6px'}}>
                            <h4 style={{marginTop:0, marginBottom:'10px', color:'#1e40af', fontSize:'11px', textTransform:'uppercase'}}>Documents (Admin)</h4>
                            <div style={{display:'flex', gap:'16px'}}>
                                <div style={{flex:1}}>{renderAdminFileInput('Drawing', drawingFile, setDrawingFile, lead.drawing)}</div>
                                <div style={{flex:1}}>{renderAdminFileInput('Commercial', commercialFile, setCommercialFile, lead.commercial)}</div>
                                <div style={{flex:1}}>{renderAdminFileInput('Tech Offer', technicalOfferFile, setTechnicalOfferFile, lead.technicalOffer)}</div>
                            </div>
                        </div>
                    )}
                    
                    {(!user || !['admin', 'god'].includes(user.role)) && (
                        <div style={{marginBottom:'16px', padding:'12px', background:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                            <h4 style={{marginTop:0, marginBottom:'8px', color:'#64748b', fontSize:'11px'}}>Documents</h4>
                            {(!lead.drawing && !lead.commercial && !lead.technicalOffer) ? (
                                <div style={{fontSize:'12px', color:'#94a3b8', fontStyle:'italic'}}>No Admin Attachments</div>
                            ) : (
                                <div style={{display:'flex', gap:'12px'}}>
                                    {lead.drawing && <a href={`${BASE_URL}/${lead.drawing}`} target="_blank" rel="noopener noreferrer" style={{fontSize:'12px', color:'#3b82f6'}}>📄 Drawing</a>}
                                    {lead.commercial && <a href={`${BASE_URL}/${lead.commercial}`} target="_blank" rel="noopener noreferrer" style={{fontSize:'12px', color:'#3b82f6'}}>📄 Commercial</a>}
                                    {lead.technicalOffer && <a href={`${BASE_URL}/${lead.technicalOffer}`} target="_blank" rel="noopener noreferrer" style={{fontSize:'12px', color:'#3b82f6'}}>📄 Tech Offer</a>}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{marginBottom:'16px', background:'#f8fafc', padding:'12px', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                        <label style={labelStyle}>Specifications <span style={{fontWeight:'normal', color:'#94a3b8'}}>(Values Only)</span></label>
                        {specList.map((item, idx) => (
                            <div key={idx} style={{display:'flex', gap:'8px', marginBottom:'6px'}}>
                                <input value={item.key} readOnly style={{flex:1, padding:'6px', background:'#e2e8f0', color:'#64748b', border:'1px solid #cbd5e1', borderRadius:'4px', fontSize:'12px'}} />
                                <input value={item.value} onChange={(e) => handleSpecValueChange(idx, e.target.value)} style={{flex:1, padding:'6px', border:'1px solid #cbd5e1', borderRadius:'4px', fontSize:'12px'}} placeholder="Value"/>
                            </div>
                        ))}
                    </div>

                    <div style={{marginBottom:'16px', display:'flex', gap:'12px'}}>
                        <div style={{flex:1}}><label style={labelStyle}>Quantity</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} style={inputStyle} /></div>
                        
                    <div style={{flex:1}}>
                        <label style={labelStyle}>Unit Price {isAdmin ? '' : '(Locked)'}</label>
                        <input type="number" name="unitPrice" value={(isAdmin || formData.stage !== 'Pending Approval') ? formData.unitPrice : ''} placeholder={(isAdmin || formData.stage !== 'Pending Approval') ? '' : '-'} onChange={handleChange} readOnly={!isAdmin} disabled={!isAdmin} style={{...inputStyle, background: isAdmin ? 'white' : '#f1f5f9', color: isAdmin ? 'inherit' : '#94a3b8'}} />
                    </div>

                    <div style={{flex:1}}>
                        <label style={labelStyle}>Total Price (Auto)</label>
                        <input type="text" name="totalPrice" value={(isAdmin || formData.stage !== 'Pending Approval') ? formData.totalPrice : '-'} readOnly={true} style={{...inputStyle, background:'#f1f5f9', color:'#64748b', cursor:'default'}} />
                    </div>
                    </div>

                    <div style={{marginBottom:'16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                        <div><label style={labelStyle}>Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Location</label><input type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} /></div>
                    </div>

                    <div style={{marginBottom:'16px', display:'flex', gap:'12px'}}>
                        <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div style={{marginBottom:'16px'}}><label style={labelStyle}>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows="2" style={{...inputStyle, fontFamily: 'inherit'}} /></div>
                    
                    <div style={{marginBottom:'20px', padding:'12px', background:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                        <label style={labelStyle}>Attachments</label>
                        <div style={{margin:'8px 0'}}>
                            {formData.keptAttachments.map((path, idx) => (<div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', padding:'6px', marginBottom:'4px', border:'1px solid #cbd5e1', borderRadius:'4px'}}><span style={{fontSize:'12px'}}>{path.split('/').pop()}</span><button type="button" onClick={() => removeExistingAttachment(idx)} style={{color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>✕</button></div>))}
                        </div>
                        <input type="file" multiple onChange={handleFileSelect} style={{fontSize:'12px'}} />
                    </div>

                    <TimelineView timeline={lead.timeline} />

                    <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                        <button type="button" onClick={onClose} style={{padding:'10px 20px', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', fontWeight:'600', color:'#475569', fontSize:'13px'}}>Cancel</button>
                        <button type="submit" style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'13px'}}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadProductStatus;