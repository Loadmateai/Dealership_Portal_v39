import React from 'react';

const FilterBar = ({
    // Removed Vendor Props as they are now in Dashboard Header
    
    // Optional Props
    onReset,     // Function to reset all filters
    viewMode,    // Current View Mode (List/Board)
    setViewMode, // Setter for View Mode
    children     // Slot for specific filters (Date, Status, Sort, etc.)
}) => {
    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            
            {/* 1. SPECIFIC FILTERS (Passed as Children) */}
            {/* This is where Search Bars, Status Selects etc will appear */}
            {children}

            {/* 2. RESET BUTTON (If provided) */}
            {onReset && (
                <button 
                    onClick={onReset} 
                    style={{ padding: '8px 15px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize:'13px', fontWeight:'500' }}
                >
                    Reset All
                </button>
            )}

            {/* 3. VIEW MODE TOGGLE (If provided) */}
            {viewMode && setViewMode && (
                <div style={{ marginLeft: 'auto', background: '#e0e0e0', borderRadius: '6px', padding: '3px', display: 'flex' }}>
                    <button 
                        onClick={() => setViewMode('list')} 
                        style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: viewMode === 'list' ? 'white' : 'transparent', fontWeight: viewMode === 'list' ? 'bold' : 'normal', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none', fontSize:'13px' }}
                    >List</button>
                    <button 
                        onClick={() => setViewMode('board')} 
                        style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: viewMode === 'board' ? 'white' : 'transparent', fontWeight: viewMode === 'board' ? 'bold' : 'normal', boxShadow: viewMode === 'board' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none', fontSize:'13px' }}
                    >Board</button>
                </div>
            )}
        </div>
    );
};

export default FilterBar;