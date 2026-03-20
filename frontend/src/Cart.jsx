import React, { useState } from 'react';
import api from './api';
import ProductCustomizationModal from './ProductCustomizationModal';
import PurchaseProgressTracker from './PurchaseProgressTracker'; 

const Cart = ({ cart, setCart, token, onOrderSuccess, userRole, notify }) => {
    const [userDetails, setUserDetails] = useState({ companyName: '', phone: '', email: '', location: '' });
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- STATE: Linking Logic ---
    const [useSupportTicket, setUseSupportTicket] = useState(false);
    const [supportTicketNum, setSupportTicketNum] = useState('');
    const [isTicketVerified, setIsTicketVerified] = useState(false);

    // New State for "Link Current Lead"
    const [useLeadLink, setUseLeadLink] = useState(false);
    const [leadLinkNum, setLeadLinkNum] = useState('');
    const [isLeadVerified, setIsLeadVerified] = useState(false);

    // --- STATE: Controls the Review Step ---
    const [showReview, setShowReview] = useState(false); 

    const grandTotal = cart.reduce((acc, item) => acc + (item.totalPrice || 0), 0);

    const handleUserChange = (e) => setUserDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleRemoveItem = (index) => setCart(cart.filter((_, i) => i !== index));
    const handleEditClick = (index) => setEditingItemIndex(index);
    const handleEditConfirm = (updatedItem) => {
        const newCart = [...cart];
        newCart[editingItemIndex] = updatedItem;
        setCart(newCart);
        setEditingItemIndex(null);
    };

    // --- VERIFICATION HANDLERS ---

    const handleVerifyTicket = async () => {
        if (!supportTicketNum.trim()) {
            if(notify) notify("Please enter a Support Ticket Number", "error");
            return;
        }
        try {
            const res = await api.get(`/api/support/lookup/${supportTicketNum}`, {
                headers: { 'x-auth-token': token }
            });
            const ticket = res.data;
            setUserDetails(prev => ({
                ...prev,
                companyName: ticket.customerName || '',
                phone: ticket.contactNumber || ''
            }));
            setIsTicketVerified(true);
            if(notify) notify(`Ticket Found! Linked to ${ticket.lead}`, 'success');
        } catch (err) {
            console.error(err);
            setIsTicketVerified(false);
            if(notify) notify("Support Ticket not found.", "error");
        }
    };

    const handleVerifyLead = async () => {
        if (!leadLinkNum.trim()) {
            if(notify) notify("Please enter a Lead Number", "error");
            return;
        }
        try {
            // Call the new backend endpoint
            const res = await api.get(`/api/lead-products/lookup/${leadLinkNum}`, {
                headers: { 'x-auth-token': token }
            });
            const lead = res.data;
            
            // Populate fields from the fetched lead
            setUserDetails({
                companyName: lead.companyName || '',
                phone: lead.phone || '',
                email: lead.email || '',
                location: lead.location || ''
            });

            setIsLeadVerified(true);
            if(notify) notify(`Lead Verified! Adding to ${lead.leadNumber}`, 'success');
        } catch (err) {
            console.error(err);
            setIsLeadVerified(false);
            if(notify) notify("Lead not found. Please check the ID.", "error");
        }
    };

    // --- TOGGLE HANDLERS (Mutually Exclusive) ---
    
    const toggleSupportTicket = (e) => {
        const checked = e.target.checked;
        setUseSupportTicket(checked);
        if (checked) {
            setUseLeadLink(false); // Disable Lead Link
            setLeadLinkNum('');
            setIsLeadVerified(false);
        } else {
            setSupportTicketNum('');
            setIsTicketVerified(false);
            setUserDetails({ companyName: '', phone: '', email: '', location: '' });
        }
    };

    const toggleLeadLink = (e) => {
        const checked = e.target.checked;
        setUseLeadLink(checked);
        if (checked) {
            setUseSupportTicket(false); // Disable Support Ticket
            setSupportTicketNum('');
            setIsTicketVerified(false);
        } else {
            setLeadLinkNum('');
            setIsLeadVerified(false);
            setUserDetails({ companyName: '', phone: '', email: '', location: '' });
        }
    };


    const handleReviewClick = () => {
        if (!userDetails.companyName || !userDetails.phone) {
            if(notify) notify('Company Name and Phone are required.', 'error');
            return;
        }
        setShowReview(true);
        window.scrollTo(0, 0); 
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('companyName', userDetails.companyName);
        formData.append('phone', userDetails.phone);
        formData.append('email', userDetails.email);
        formData.append('location', userDetails.location);
        
        // Append Link IDs if verified
        if (useSupportTicket && isTicketVerified) {
            formData.append('linkedSupportId', supportTicketNum);
        }
        if (useLeadLink && isLeadVerified) {
            formData.append('linkedLeadId', leadLinkNum);
        }

        const itemsMetadata = cart.map(item => ({
            title: item.productCode, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice, specifications: item.specifications, notes: item.notes
        }));
        formData.append('cartItems', JSON.stringify(itemsMetadata));
        cart.forEach((item, index) => {
            if (item.attachments) item.attachments.forEach(file => formData.append(`attachments_${index}`, file));
        });

        try {
            const res = await api.post('/api/lead-products/generate', formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            if(notify) notify(`Success! Batch ID: ${res.data.batchId}`, 'success');
            setCart([]);
            onOrderSuccess();
        } catch (err) { 
            if(notify) notify('Failed to generate leads.', 'error'); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    // --- STYLES ---
    const styles = {
        container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px 40px 24px', boxSizing: 'border-box' },
        header: { 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            marginBottom: '16px', background: 'white', 
            padding: '16px 24px', 
            borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        },
        headerTitle: { margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '700' },
        headerTotal: { fontSize: '16px', fontWeight: '700', color: '#0f172a' },
        itemCard: { 
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
            padding: '16px 24px', 
            marginBottom: '10px', background: 'white', 
            borderRadius: '8px', border: '1px solid #cbd5e1'
        },
        itemTitle: { margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#1e293b' },
        itemMeta: { fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', alignItems: 'center' },
        actionBtn: (color) => ({ 
            padding: '4px 10px', background: 'white', color: color, 
            border: `1px solid ${color}`, borderRadius: '6px', cursor: 'pointer', 
            fontSize: '11px', fontWeight: '600', marginLeft: '8px' 
        }),
        formContainer: { 
            marginTop: '20px', background: 'white', 
            padding: '24px', 
            borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
        },
        formHeaderRow: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' 
        },
        formTitle: { margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '700' },
        label: { display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '12px', color: '#64748b' },
        input: { 
            width: '100%', padding: '8px', borderRadius: '6px', 
            border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '13px',
            marginBottom: '12px', background: 'white', color: '#334155'
        },
        ticketArea: {
            marginBottom: '16px', padding: '12px', background: '#eff6ff', 
            borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '10px'
        },
        // New Style for Lead Link Area (Distinct Color)
        leadLinkArea: {
            marginBottom: '16px', padding: '12px', background: '#f0fdf4', 
            borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '10px'
        },
        submitBtn: { 
            width: '100%', padding: '8px 20px', background: '#10b981', color: 'white', 
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', 
            cursor: 'pointer', marginTop: '16px' 
        },
        reviewBtn: { 
            width: '100%', padding: '8px 20px', background: '#3b82f6', color: 'white', 
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', 
            cursor: 'pointer', marginTop: '16px' 
        },
        backBtn: { 
            padding: '8px 20px', background: 'white', color: '#475569', 
            border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', 
            fontWeight: '600', marginRight: '10px', fontSize: '13px' 
        },
        verifyBtn: { 
            padding: '8px 14px', background: '#3b82f6', color: 'white', 
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' 
        },
        reviewGrid: { 
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', 
            marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' 
        },
        reviewValue: { fontSize: '13px', color: '#1e293b', fontWeight: '500' }
    };

    if (cart.length === 0) return (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#94a3b8' }}>
            <h2 style={{fontSize: '20px', marginBottom: '8px'}}>🛒</h2>
            <p style={{fontSize: '13px'}}>Your cart is currently empty.</p>
        </div>
    );

    return (
        <div style={styles.container}>
            <PurchaseProgressTracker currentStep={showReview ? "Review & Submit" : "Customer Details"} />

            <div style={styles.header}>
                <h2 style={styles.headerTitle}>
                    {showReview ? 'Order Summary' : `Shopping Cart (${cart.length})`}
                </h2>
                {/*<div style={styles.headerTotal}>
                    Total: ₹{grandTotal.toLocaleString()}
                </div>*/}

            </div>

            <div>
                {cart.map((item, index) => (
                    <div key={index} style={styles.itemCard}>
                        <div style={{ flex: 1 }}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px'}}>
                                <h4 style={styles.itemTitle}>{item.title}</h4>
                                <span style={{ background: '#f1f5f9', color:'#64748b', fontSize:'11px', padding:'2px 6px', borderRadius:'4px', border:'1px solid #cbd5e1' }}>#{item.productCode}</span>
                            </div>
                            <div style={styles.itemMeta}>
                                <span>Qty: <strong>{item.quantity}</strong></span>
                                <span style={{color: '#cbd5e1'}}></span>
                                {/*<span>Unit: ₹{item.unitPrice}</span>
                                <span style={{color: '#cbd5e1'}}>|</span>
                                <span style={{ color: '#0f172a', fontWeight: '600' }}>Total: ₹{item.totalPrice}</span>*/}

                            </div>
                            {item.specifications && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', background:'#f8fafc', padding:'6px', borderRadius:'4px', display:'inline-block', border: '1px solid #f1f5f9' }}>
                                    {Object.entries(item.specifications).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}...
                                </div>
                            )}
                        </div>
                        {!showReview && (
                            <div style={{ display: 'flex' }}>
                                <button onClick={() => handleEditClick(index)} style={styles.actionBtn('#3b82f6')}>Edit</button>
                                <button onClick={() => handleRemoveItem(index)} style={styles.actionBtn('#ef4444')}>Remove</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={styles.formContainer}>
                {!showReview ? (
                    <>
                        <div style={styles.formHeaderRow}>
                            <h3 style={styles.formTitle}>Customer Details</h3>
                            <div style={{display: 'flex', gap: '16px'}}>
                                {/* Toggle 1: Support Ticket */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        id="ticketToggle"
                                        checked={useSupportTicket} 
                                        onChange={toggleSupportTicket}
                                        style={{ width: '14px', height: '14px', marginRight: '6px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="ticketToggle" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
                                        Link Ticket
                                    </label>
                                </div>

                                {/* Toggle 2: Current Lead (New) */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        id="leadToggle"
                                        checked={useLeadLink} 
                                        onChange={toggleLeadLink}
                                        style={{ width: '14px', height: '14px', marginRight: '6px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="leadToggle" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
                                        Link Lead
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Support Ticket Input */}
                        {useSupportTicket && (
                            <div style={styles.ticketArea}>
                                <div style={{flex: 1}}>
                                    <input 
                                        placeholder="Enter Ticket ID (e.g. SUP-999)" 
                                        value={supportTicketNum} 
                                        onChange={(e) => {
                                            setSupportTicketNum(e.target.value);
                                            setIsTicketVerified(false); 
                                        }}
                                        style={{...styles.input, marginBottom: 0}} 
                                    />
                                </div>
                                <button onClick={handleVerifyTicket} style={styles.verifyBtn}>Verify</button>
                                {isTicketVerified && <div style={{ color: '#15803d', fontSize: '12px', fontWeight: '600' }}>✓ Found</div>}
                            </div>
                        )}

                        {/* Section 2: Link Lead Input (New) */}
                        {useLeadLink && (
                            <div style={styles.leadLinkArea}>
                                <div style={{flex: 1}}>
                                    <input 
                                        placeholder="Enter Lead ID (e.g. ABC-2025-1234)" 
                                        value={leadLinkNum} 
                                        onChange={(e) => {
                                            setLeadLinkNum(e.target.value);
                                            setIsLeadVerified(false); 
                                        }}
                                        style={{...styles.input, marginBottom: 0}} 
                                    />
                                </div>
                                <button onClick={handleVerifyLead} style={{...styles.verifyBtn, background:'#10b981'}}>Verify</button>
                                {isLeadVerified && <div style={{ color: '#15803d', fontSize: '12px', fontWeight: '600' }}>✓ Found</div>}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={styles.label}>Company Name *</label>
                                <input placeholder="Enter Company Name" name="companyName" value={userDetails.companyName} onChange={handleUserChange} style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Phone Number *</label>
                                <input placeholder="Enter Phone Number" name="phone" value={userDetails.phone} onChange={handleUserChange} style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Email Address</label>
                                <input placeholder="Enter Email" name="email" value={userDetails.email} onChange={handleUserChange} style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Location</label>
                                <input placeholder="Site Address" name="location" value={userDetails.location} onChange={handleUserChange} style={styles.input} />
                            </div>
                        </div>
                        <button onClick={handleReviewClick} style={styles.reviewBtn}>
                            Proceed to Review
                        </button>
                    </>
                ) : (
                    <>
                        <h3 style={styles.formTitle}>Confirm Details</h3>
                        <p style={{color: '#64748b', fontSize: '12px', margin: '4px 0 16px 0'}}>Please review your details before placing the final order.</p>
                        
                        <div style={styles.reviewGrid}>
                            {useSupportTicket && isTicketVerified && (
                                <div style={{ gridColumn: 'span 2', background: '#f0f9ff', padding: '8px', borderRadius: '6px', marginBottom: '4px', color: '#0369a1', fontWeight: '600', fontSize: '12px', border: '1px solid #bae6fd' }}>
                                    🔗 Linked to Ticket: {supportTicketNum}
                                </div>
                            )}

                            {/* Show Linked Lead Info in Review */}
                            {useLeadLink && isLeadVerified && (
                                <div style={{ gridColumn: 'span 2', background: '#f0fdf4', padding: '8px', borderRadius: '6px', marginBottom: '4px', color: '#15803d', fontWeight: '600', fontSize: '12px', border: '1px solid #bbf7d0' }}>
                                    🔗 Appending to Lead: {leadLinkNum}
                                </div>
                            )}

                            <div>
                                <div style={styles.label}>Company Name</div>
                                <div style={styles.reviewValue}>{userDetails.companyName}</div>
                            </div>
                            <div>
                                <div style={styles.label}>Phone Number</div>
                                <div style={styles.reviewValue}>{userDetails.phone}</div>
                            </div>
                            <div>
                                <div style={styles.label}>Email Address</div>
                                <div style={styles.reviewValue}>{userDetails.email || '-'}</div>
                            </div>
                            <div>
                                <div style={styles.label}>Location</div>
                                <div style={styles.reviewValue}>{userDetails.location || '-'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                            <button onClick={() => setShowReview(false)} style={styles.backBtn}>
                                Cancel
                            </button>
                            <button onClick={handleFinalSubmit} disabled={isSubmitting} style={{...styles.submitBtn, marginTop: 0}}>
                                {isSubmitting ? 'Processing...' : 'Confirm & Generate Lead'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {editingItemIndex !== null && <ProductCustomizationModal product={cart[editingItemIndex]} initialData={cart[editingItemIndex]} onClose={() => setEditingItemIndex(null)} onConfirm={handleEditConfirm} userRole={userRole}/>}
        </div>
    );
};
export default Cart;