import React, { useState, useEffect } from 'react';
import PurchaseProgressTracker from './PurchaseProgressTracker'; 

const ProductCustomizationModal = ({ product, initialData, onClose, onConfirm, userRole }) => {
    const [standardData, setStandardData] = useState({
        quantity: 1, unitPrice: product.basePrice || 0, notes: '', productCode: product.productCode || 'N/A', ...initialData 
    });
    const [specData, setSpecData] = useState(initialData?.specifications || {});
    const [existingFiles, setExistingFiles] = useState(initialData?.attachments || []);
    const [newFiles, setNewFiles] = useState([]);
    const [total, setTotal] = useState(0);

    // Determines if user can edit price
    const canEditPrice = ['admin', 'god'].includes(userRole);

    useEffect(() => {
        if (product.formFields && Object.keys(specData).length === 0) {
            const defaults = {};
            product.formFields.forEach(field => defaults[field.label] = field.options ? field.options[0] : '');
            setSpecData(defaults);
        }
    }, [product]);

    useEffect(() => setTotal(standardData.quantity * standardData.unitPrice), [standardData.quantity, standardData.unitPrice]);

    const handleFileChange = (e) => { if (e.target.files) setNewFiles(prev => [...prev, ...Array.from(e.target.files)]); };
    const removeExistingFile = (index) => setExistingFiles(prev => prev.filter((_, i) => i !== index));
    const removeNewFile = (index) => setNewFiles(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = () => {
        const finalAttachments = [...existingFiles, ...newFiles];
        onConfirm({ ...product, ...standardData, totalPrice: total, specifications: specData, attachments: finalAttachments });
    };

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
        header: { margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' },
        section: { background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' },
        label: { display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '12px', color: '#64748b' },
        input: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '13px', marginBottom: '12px' },
        totalBox: { textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '16px 0' },
        btnGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        btnSave: { padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
        btnCancel: { padding: '8px 20px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
        // Disabled input style
        disabledInput: { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                
                <PurchaseProgressTracker currentStep="Technical Specs" />

                <h2 style={styles.header}>{initialData ? 'Edit Configuration' : `Configure: ${product.title}`}</h2>
                
                {product.formFields && product.formFields.length > 0 && (
                    <div style={styles.section}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155' }}>Technical Specs</h4>
                        {product.formFields.map((field, idx) => (
                            <div key={idx}>
                                <label style={styles.label}>{field.label}</label>
                                {field.type === 'select' ? (
                                    <select style={styles.input} value={specData[field.label] || ''} onChange={(e) => setSpecData({...specData, [field.label]: e.target.value})}>
                                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={field.type || 'text'} style={styles.input} value={specData[field.label] || ''} onChange={(e) => setSpecData({...specData, [field.label]: e.target.value})} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div>
                        <label style={styles.label}>Quantity</label>
                        <input type="number" min="1" style={styles.input} value={standardData.quantity} onChange={(e) => setStandardData({...standardData, quantity: e.target.value})} />
                    </div>
                   {/* <div>
                        <label style={styles.label}>Estimated Unit Price (₹)</label>
                        <input 
                            type="number" 
                            style={{...styles.input, ...(canEditPrice ? {} : styles.disabledInput)}} 
                            value={standardData.unitPrice} 
                            onChange={(e) => setStandardData({...standardData, unitPrice: e.target.value})} 
                            disabled={!canEditPrice}
                        />
                    </div> */}

                </div>

                <label style={styles.label}>Notes / Requirements</label>
                <textarea style={{ ...styles.input, height: '60px', fontFamily: 'inherit' }} value={standardData.notes} onChange={(e) => setStandardData({...standardData, notes: e.target.value})} />

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <label style={styles.label}>Attachments</label>
                    <input type="file" multiple onChange={handleFileChange} style={{ fontSize: '12px' }} />
                    <div style={{ marginTop: '8px' }}>
                        {[...existingFiles, ...newFiles].map((file, i) => (
                            <div key={i} style={{ fontSize: '11px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                                <span>📎 {file.name}</span>
                                <span onClick={() => i < existingFiles.length ? removeExistingFile(i) : removeNewFile(i - existingFiles.length)} style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>✕</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/*<div style={styles.totalBox}>Estimated Total: ₹{total.toLocaleString()}</div>*/}
                <div style={styles.btnGroup}>
                    <button onClick={onClose} style={styles.btnCancel}>Cancel</button>
                    <button onClick={handleSubmit} style={styles.btnSave}>{initialData ? 'Save Changes' : 'Add to Cart'}</button>
                </div>
            </div>
        </div>
    );
};
export default ProductCustomizationModal;