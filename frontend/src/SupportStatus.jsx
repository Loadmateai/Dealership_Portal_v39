import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🚀 IMPORT REACT QUERY
import api , {BASE_URL} from './api';
import { jwtDecode } from "jwt-decode";
import FilterBar from './FilterBar';
import TableSkeleton from './TableSkeleton';


// ... [HistoryModal remains unchanged] ...
const HistoryModal = ({ ticket, onClose }) => {
    if (!ticket) return null;
    return (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1100}}>
            <div style={{background:'white', padding:'20px', borderRadius:'12px', width:'380px', maxHeight:'80vh', overflowY:'auto'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px', alignItems:'center'}}>
                    <h3 style={{margin:0, fontSize:'14px', color:'#1e293b'}}>History: {ticket.lead}</h3>
                    <button onClick={onClose} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', color:'#64748b'}}>×</button>
                </div>
                {(!ticket.timeline || ticket.timeline.length === 0) ? (
                    <div style={{color:'#94a3b8', fontStyle:'italic', textAlign:'center', padding:'15px', fontSize:'12px'}}>No history recorded.</div>
                ) : (
                    <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                        {ticket.timeline.slice().reverse().map((t, i) => (
                            <div key={i} style={{fontSize:'12px', borderLeft:'2px solid #e2e8f0', paddingLeft:'12px', position:'relative'}}>
                                <div style={{position:'absolute', left:'-5px', top:0, width:'8px', height:'8px', borderRadius:'50%', background:'#cbd5e1'}}></div>
                                <div style={{fontWeight:'bold', color:'#334155'}}>{t.userName} <span style={{fontSize:'10px', color:'#94a3b8', fontWeight:'normal'}}>({t.userRole})</span></div>
                                <div style={{color:'#1e293b', margin:'3px 0'}}>{t.details}</div>
                                <div style={{fontSize:'10px', color:'#94a3b8'}}>{new Date(t.timestamp).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SupportStatus = ({ token, setView, onEdit, appliedVendorCode, appliedGroup, notify }) => {
    const queryClient = useQueryClient(); // 🚀 Gives us caching powers

    const [viewMode, setViewMode] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [historyTicket, setHistoryTicket] = useState(null);

    const user = token ? jwtDecode(token).user : { role: 'user' };
    const isManager = ['admin', 'god'].includes(user.role);

    // 🚀 REACT QUERY: TICKETS CACHING
    const { data: tickets = [], isLoading: loading } = useQuery({
        queryKey: ['supportTickets', appliedGroup],
        queryFn: async () => {
            const minDelay = new Promise(resolve => setTimeout(resolve, 300));
            const apiCall = api.get('/api/support', { 
                params: { group: appliedGroup },
                headers: { 'x-auth-token': token } 
            });
            const [res] = await Promise.all([apiCall, minDelay]);
            return res.data;
        },
        enabled: !!token,
        staleTime: 1000 * 60 * 5 // Cache for 5 minutes
    });

    const handleStatusChange = async (id, newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) return;
        try {
            await api.put(`/api/support/${id}`, { status: newStatus }, { headers: { 'x-auth-token': token } });
            
            // 🚀 MAGIC: Invalidate caches to instantly refresh the table and dashboard!
            queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            
        } catch (err) { 
            if(notify) notify('Error updating status', 'error');
        }
    };

    const toggleSection = (stageName) => {
        setExpandedSections(prev => ({ ...prev, [stageName]: !prev[stageName] }));
    };

    const stages = [
        { name: 'Pending Approval', color: '#f59e0b' },
        { name: 'Approved', color: '#3b82f6' },
        { name: 'In Progress', color: '#8b5cf6' },
        { name: 'Closed', color: '#10b981' }
    ];

    const filteredTickets = tickets.filter(t => {
        const lowerTerm = searchTerm ? searchTerm.toLowerCase() : '';
        const matchesSearch = !searchTerm || (
            (t.lead && t.lead.toLowerCase().includes(lowerTerm)) ||
            (t.customerName && t.customerName.toLowerCase().includes(lowerTerm)) ||
            (t.issueType && t.issueType.toLowerCase().includes(lowerTerm)) ||
            (t.product && t.product.toLowerCase().includes(lowerTerm))
        );
        const matchesStatus = !statusFilter || t.status === statusFilter;
        const matchesVendor = !appliedVendorCode || 
            (t.lead && t.lead.toLowerCase().startsWith(appliedVendorCode.toLowerCase()));

        return matchesSearch && matchesStatus && matchesVendor;
    });

    const tagStyle = (bg, color) => ({ background: bg, color: color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' });
    const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', background: 'white' };

    // --- LIST VIEW HELPERS (UNIFORM FIX) ---
    const colWidths = isManager 
        ? { ref: '15%', cust: '18%', issue: '18%', prio: '10%', att: '15%', act: '12%', upd: '12%' }
        : { ref: '15%', cust: '20%', issue: '25%', prio: '10%', att: '15%', act: '15%', upd: '0%' };

    const renderListHeader = () => {
        const headerStyle = { 
            padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #f1f5f9'
        };
        return (
            <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ ...headerStyle, width: colWidths.ref }}>Support Ticket</div>
                <div style={{ ...headerStyle, width: colWidths.cust }}>Client</div>
                <div style={{ ...headerStyle, width: colWidths.issue }}>Issue</div>
                <div style={{ ...headerStyle, width: colWidths.prio }}>Priority</div>
                <div style={{ ...headerStyle, width: colWidths.att }}>Attachments</div>
                <div style={{ ...headerStyle, width: colWidths.act }}>Actions</div>
                {isManager && <div style={{ ...headerStyle, width: colWidths.upd, borderRight:'none' }}>Update</div>}
            </div>
        );
    };

    const renderListTable = (stageName, color) => {
        const data = filteredTickets.filter(t => t.status === stageName);
        if (data.length === 0) return null;
        const isExpanded = expandedSections[stageName];

        return (
            <div key={stageName} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div 
                    onClick={() => toggleSection(stageName)}
                    style={{ padding: '12px 16px', background: isExpanded ? '#f8fafc' : 'white', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s' }}
                >
                    <div style={{ fontSize: '12px', color: '#64748b', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>
                    <h3 style={{ margin: 0, fontSize: '13px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                        {stageName} ({data.length})
                    </h3>
                </div>

                {isExpanded && (
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', animation: 'fadeIn 0.3s' }}>
                        <tbody>
                            {data.map(t => (
                                <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px 16px', width: colWidths.ref, verticalAlign: 'top' }}>
                                        <div style={{ fontWeight: '600', color: '#3b82f6', fontSize: '13px' }}>{t.lead}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.user?.name ? `By: ${t.user.name}` : '(User Unknown)'}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', width: colWidths.cust, verticalAlign: 'top' }}>
                                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{t.customerName}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{t.contactNumber}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', width: colWidths.issue, verticalAlign: 'top' }}>
                                        <div style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{t.issueType}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{t.product}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', width: colWidths.prio, verticalAlign: 'top' }}>
                                        <span style={tagStyle(t.priority === 'High' ? '#fee2e2' : '#f1f5f9', t.priority === 'High' ? '#dc2626' : '#64748b')}>{t.priority}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', width: colWidths.att, verticalAlign: 'top' }}>
                                        {t.attachments && t.attachments.length > 0 ? (
                                            <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                                {t.attachments.map((path, i) => (
                                                    <a key={i} href={`${BASE_URL}/${path}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', fontSize:'11px', textDecoration:'underline'}}>File {i+1}</a>
                                                ))}
                                            </div>
                                        ) : (t.attachment ? <a href={`${BASE_URL}/${t.attachment}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', fontSize:'11px'}}>View</a> : '-')}
                                    </td>
                                    <td style={{ padding: '14px 16px', width: colWidths.act, verticalAlign: 'top' }}>
                                        <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                                            <button onClick={() => onEdit(t)} style={{ border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '4px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight:'600' }}>Edit</button>
                                            <button onClick={() => setHistoryTicket(t)} style={{border:'1px solid #cbd5e1', background:'white', borderRadius:'4px', padding:'6px', cursor:'pointer', fontSize:'11px'}} title="View History">📜</button>
                                        </div>
                                    </td>
                                    {isManager && (
                                        <td style={{ padding: '14px 16px', width: colWidths.upd, verticalAlign: 'top' }}>
                                            <select value={t.status} onChange={(e) => handleStatusChange(t._id, e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', width: '100%', background:'white' }}>
                                                {stages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
            </div>
        );
    };

    const renderBoardColumn = (stageName, color) => {
        const data = filteredTickets.filter(t => t.status === stageName);
        return (
            <div key={stageName} style={{ minWidth: '280px', width: '280px', display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                    <div style={{ fontWeight: '600', color: '#334155', fontSize: '13px' }}>{stageName}</div>
                    <span style={{ background: color, color: 'white', borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>{data.length}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap:'10px' }}>
                    {data.map(t => (
                        <div key={t._id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'6px', color:'#64748b'}}>
                                <span style={{fontWeight:'bold'}}>{t.lead}</span>
                                <span>{t.user?.name || 'Unknown'}</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={tagStyle('#f1f5f9', '#475569')}>{t.issueType}</span>
                                <span style={tagStyle(t.priority === 'High' ? '#fee2e2' : '#f0fdf4', t.priority === 'High' ? '#dc2626' : '#15803d')}>{t.priority}</span>
                            </div>
                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px', fontSize: '13px' }}>{t.customerName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{t.issueDescription}</div>
                            
                            {t.attachments && t.attachments.length > 0 && (
                                <div style={{marginBottom: '10px', fontSize: '11px'}}>
                                    <strong>Files: </strong>
                                    {t.attachments.map((path, i) => (
                                         <a key={i} href={`${BASE_URL}/${path}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', marginRight:'5px'}}>#{i+1}</a>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => onEdit(t)} style={{ flex: 1, padding: '6px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#334155', fontWeight:'600' }}>Edit</button>
                                <button onClick={() => setHistoryTicket(t)} style={{padding:'6px', border:'1px solid #e2e8f0', background:'white', borderRadius:'4px', cursor:'pointer'}} title="History">📜</button>

                                {isManager && (
                                    <select value={t.status} onChange={(e) => handleStatusChange(t._id, e.target.value)} style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                                        {stages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{flex: 1}}>
                     <FilterBar viewMode={viewMode} setViewMode={setViewMode}>
                        <input type="text" placeholder="🔍 Search Ticket..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, width: '220px'}} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                            <option value="">All Statuses</option>
                            {stages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </FilterBar>
                </div>

                <button onClick={() => setView('support-ticket')} style={{ background: '#4eafff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginLeft: '15px', fontSize:'13px' }}>
                    + New Ticket
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? <TableSkeleton/> : (
                    viewMode === 'list' ? (
                        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            {renderListHeader()}
                            {stages.map(s => renderListTable(s.name, s.color))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', height: '100%', alignItems: 'flex-start', paddingBottom: '10px' }}>
                        {stages.map(s => renderBoardColumn(s.name, s.color))}
                    </div>
                )
                )}
            </div>
            
            {historyTicket && <HistoryModal ticket={historyTicket} onClose={() => setHistoryTicket(null)} />}
        </div>
    );
};
export default SupportStatus;