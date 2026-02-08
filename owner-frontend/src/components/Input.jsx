import React from 'react';
import '../styles/components.css';

const Input = ({ label, type = 'text', placeholder, value, onChange, className = '', ...props }) => {
    return (
        <div className={`common-input-group ${className}`}>
            {label && <label className="common-input-label">{label}</label>}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="common-input"
                {...props}
            />
        </div>
    );
};

export default Input;
