import React from 'react';

const PurchaseProgressTracker = ({ currentStep }) => {
    const steps = ['Product Selection', 'Technical Specs', 'Customer Details', 'Review & Submit'];
    const currentIdx = steps.indexOf(currentStep);

    return (
        <div style={{ padding: '10px 0 20px 0', width: '100%', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '450px' }}>
                {steps.map((step, i) => {
                    const isCompleted = i < currentIdx;
                    const isActive = i === currentIdx;
                    
                    // Colors
                    let circleColor = isCompleted ? '#10b981' : (isActive ? '#3b82f6' : '#e2e8f0'); 
                    let textColor = isActive ? '#1e293b' : '#94a3b8';
                    let fontWeight = isActive ? '700' : '500';
                    let ring = isActive ? '0 0 0 3px #bfdbfe' : 'none';

                    return (
                        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 }}>
                            
                            {/* Connecting Line */}
                            {i < steps.length - 1 && (
                                <div style={{
                                    position: 'absolute', top: '13px', left: '50%', right: '-50%', 
                                    height: '2px', background: i < currentIdx ? '#10b981' : '#f1f5f9', 
                                    zIndex: 0
                                }} />
                            )}
                            
                            {/* Circle */}
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', 
                                background: circleColor, color: 'white', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold',
                                zIndex: 1, border: '2px solid white', boxShadow: ring,
                                transition: 'all 0.3s'
                            }}>
                                {isCompleted ? '✓' : (i + 1)}
                            </div>
                            
                            {/* Label */}
                            <div style={{ marginTop: '8px', fontSize: '11px', color: textColor, fontWeight: fontWeight, textAlign: 'center' }}>
                                {step}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PurchaseProgressTracker;