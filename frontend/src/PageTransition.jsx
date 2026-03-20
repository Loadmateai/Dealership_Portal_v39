import React from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <div key={location.pathname} style={{ animation: 'linearSlide 0.4s ease-out' }}>
            {children}
            
            <style>{`
                @keyframes linearSlide {
                    from { 
                        opacity: 0; 
                        transform: translateX(15px); /* Start slightly to the right */
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); /* End at natural position */
                    }
                }
            `}</style>
        </div>
    );
};

export default PageTransition;