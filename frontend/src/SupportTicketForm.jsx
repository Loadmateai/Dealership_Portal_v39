import React, { useState, useEffect } from 'react';
import api , {BASE_URL} from './api';

// --- CONFIGURATION: ISSUE TYPES MAPPING ---
const PRODUCT_ISSUES = {
    'Electric Wire Hoist': ['A', 'B', 'C', 'D', 'E', 'Other'],
    'Electric Chain Hoist': ['F', 'G', 'H', 'I','J' ,'Other'],
    'Overhead EOT Cranes': ['A', 'B', 'C', 'D', 'E', 'Other'],
    'Goliath Cranes': ['F', 'G', 'H', 'I','J' ,'Other'],
    'Blocks': ['A', 'B', 'C', 'D', 'E', 'Other'],
    'Trolley': ['F', 'G', 'H', 'I','J' ,'Other'],
    'Manual Push Pull Block': ['A', 'B', 'C', 'D', 'E', 'Other'],
    'JIB Crane': ['F', 'G', 'H', 'I','J' ,'Other']
};

const DEFAULT_ISSUES = ['Technical', 'Billing', 'Installation', 'Other'];

const SupportTicketForm = ({ token, editingItem, setEditingItem, onSuccess, onCancel, notify }) => {
    // 1. Initialize State
    const [formData, setFormData] = useState({
        lead: '', 
        product: 'Electric Wire Hoist', 
        issueType: PRODUCT_ISSUES['Electric Wire Hoist'][0], 
        priority: 'Medium',
        customerName: '', contactNumber: '', issueDescription: '', remarks: '', 
        files: [], 
        contactPersonName: '', contactPersonEmail: '' 
    });

    const currentIssueOptions = PRODUCT_ISSUES[formData.product] || DEFAULT_ISSUES;

    useEffect(() => {
        if (editingItem) {
            setFormData({ 
                ...editingItem, 
                files: [], 
                remarks: editingItem.remarks || '',
                contactPersonName: editingItem.contactPersonName || '',
                contactPersonEmail: editingItem.contactPersonEmail || ''
            });
        }
    }, [editingItem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'product') {
            const newIssues = PRODUCT_ISSUES[value] || DEFAULT_ISSUES;
            setFormData({ 
                ...formData, 
                [name]: value,
                issueType: newIssues[0] 
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleFileChange = (e) => {
        setFormData({ ...formData, files: Array.from(e.target.files) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'files' && key !== '_id' && key !== 'attachments') {
                data.append(key, formData[key]);
            }
        });
        if (formData.files && formData.files.length > 0) {
            formData.files.forEach((file) => {
                data.append('attachments', file);
            });
        }
        try {
            const url = editingItem ? `/api/support/${editingItem._id}` : `/api/support`;
            const method = editingItem ? api.put : api.post;
            await method(url, data, { headers: { 'x-auth-token': token , 'Content-Type': 'multipart/form-data' } });
            if(notify) notify(editingItem ? 'Ticket Updated!' : 'Ticket Created!', 'success');
            if (setEditingItem) setEditingItem(null);
            if (onSuccess) onSuccess();
        } catch (err) { 
            if(notify) notify('Error saving ticket', 'error');
        }
    };

    const styles = {
        container: { background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', maxWidth: '650px', margin: '0 auto' },
        header: { margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', fontWeight: '700' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
        label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' },
        input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', color: '#334155', fontSize: '13px' },
        button: { width: '100%', padding: '10px', background: editingItem ? '#f59e0b' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }
    };

    const inputStyle = (isDisabled) => ({
        ...styles.input,
        background: isDisabled ? '#f1f5f9' : 'white',
        color: isDisabled ? '#94a3b8' : '#334155',
        cursor: isDisabled ? 'not-allowed' : 'text'
    });

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>{editingItem ? 'Edit Support Ticket' : 'New Ticket'}</h2>
            <form onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    {editingItem && (
                         <div style={{gridColumn: 'span 2'}}>
                            <label style={styles.label}>Ticket Reference (Auto)</label>
                            <input value={formData.lead} disabled style={inputStyle(true)} />
                         </div>
                    )}

                    <div>
                        <label style={styles.label}>Product Name</label>
                        <select name="product" value={formData.product} onChange={handleChange} disabled={!!editingItem} style={inputStyle(!!editingItem)} >
                            <option>Electric Wire Hoist</option>
                            <option>Electric Chain Hoist</option>
                            <option>Overhead EOT Cranes</option>
                            <option>Goliath Cranes</option>
                            <option>Blocks</option>
                            <option>Trolley</option>
                            <option>Manual Push Pull Block</option>
                            <option>JIB Crane</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={styles.label}>Issue Type</label>
                        <select name="issueType" value={formData.issueType} onChange={handleChange} disabled={!!editingItem} style={inputStyle(!!editingItem)}>
                            {currentIssueOptions.map((issue, index) => (
                                <option key={index} value={issue}>{issue}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={styles.label}>Contact Person Name</label>
                        <input name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} placeholder="e.g. John Doe" disabled={!!editingItem} style={inputStyle(!!editingItem)} />
                    </div>
                    <div>
                        <label style={styles.label}>Contact Person Email</label>
                        <input name="contactPersonEmail" type="email" value={formData.contactPersonEmail} onChange={handleChange} placeholder="e.g. john@company.com" disabled={!!editingItem} style={inputStyle(!!editingItem)} />
                    </div>
                    
                    <div>
                        <label style={styles.label}>Priority</label>
                        <select name="priority" value={formData.priority} onChange={handleChange} disabled={!!editingItem} style={inputStyle(!!editingItem)}>
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Customer Name</label>
                        <input name="customerName" value={formData.customerName} onChange={handleChange} required disabled={!!editingItem} style={inputStyle(!!editingItem)} />
                    </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                     <label style={styles.label}>Contact Number</label>
                     <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} required disabled={!!editingItem} style={inputStyle(!!editingItem)} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Issue Description</label>
                    <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} required style={{ ...styles.input, minHeight: '80px', fontFamily: 'inherit' }} />
                </div>

                <div style={styles.grid}>
                    <div>
                        <label style={styles.label}>Attachments</label>
                        <input type="file" multiple onChange={handleFileChange} style={{...styles.input, padding: '6px', fontSize: '11px'}} />
                    </div>
                    <div>
                        <label style={styles.label}>Remarks</label>
                        <input name="remarks" value={formData.remarks} onChange={handleChange} style={styles.input} />
                    </div>
                </div>

                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                    <button type="button" onClick={onCancel} style={{...styles.button, background: 'white', color: '#64748b', border: '1px solid #cbd5e1'}}>Cancel</button>
                    <button type="submit" style={styles.button}>{editingItem ? 'Update Ticket' : 'Submit Ticket'}</button>
                </div>
            </form>
        </div>
    );
};
export default SupportTicketForm;