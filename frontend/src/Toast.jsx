import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto close after 3 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        container: {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: type === 'error' ? '#ef4444' : '#10b981', // Red for error, Green for success
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out forwards',
            fontWeight: '600',
            fontSize: '14px',
            minWidth: '250px'
        },
        icon: { fontSize: '18px' }
    };

    return (
        <div style={styles.container}>
            <span style={styles.icon}>{type === 'error' ? '⚠️' : '✅'}</span>
            <span>{message}</span>
            <style>
                {`
                    @keyframes slideIn {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

export default Toast;