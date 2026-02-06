import React from 'react';
import '../styles/components.css';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', ...props }) => {
    return (
        <button
            type={type}
            className={`common-btn btn-${variant} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
