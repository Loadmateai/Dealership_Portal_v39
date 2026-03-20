import React from 'react';

const TableSkeleton = () => (
    <div style={{background:'white', borderRadius:'8px', padding:'16px', border:'1px solid #e2e8f0', width: '100%', boxSizing: 'border-box'}}>
        {/* Header Simulation */}
        <div style={{display:'flex', gap:'16px', marginBottom:'24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px'}}>
            <div style={{width:'120px', height:'20px', background:'#e2e8f0', borderRadius:'4px', animation:'pulse 1.5s infinite'}}></div>
            <div style={{width:'80px', height:'20px', background:'#e2e8f0', borderRadius:'4px', animation:'pulse 1.5s infinite', marginLeft: 'auto'}}></div>
        </div>

        {/* Rows Simulation */}
        {[1,2,3,4,5].map(i => (
            <div key={i} style={{display:'flex', gap:'16px', marginBottom:'16px', alignItems:'center'}}>
                <div style={{width:'32px', height:'32px', background:'#f1f5f9', borderRadius:'50%', animation:'pulse 1.5s infinite'}}></div>
                <div style={{flex:1, height:'16px', background:'#f1f5f9', borderRadius:'4px', animation:'pulse 1.5s infinite'}}></div>
                <div style={{width:'80px', height:'16px', background:'#f1f5f9', borderRadius:'4px', animation:'pulse 1.5s infinite'}}></div>
            </div>
        ))}
        <style>{`@keyframes pulse { 0% {opacity: 1;} 50% {opacity: 0.5;} 100% {opacity: 1;} }`}</style>
    </div>
);

export default TableSkeleton;