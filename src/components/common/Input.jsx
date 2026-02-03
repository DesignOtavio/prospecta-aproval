import { useState } from 'react';
import './Input.css';

const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    helperText,
    required = false,
    disabled = false,
    fullWidth = false,
    className = '',
    ...props
}) => {
    const [focused, setFocused] = useState(false);

    const classes = [
        'input-wrapper',
        fullWidth && 'input-wrapper--full-width',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const inputClasses = [
        'input',
        error && 'input--error',
        focused && 'input--focused',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes}>
            {label && (
                <label htmlFor={name} className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}

            {type === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClasses}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    rows={4}
                    {...props}
                />
            ) : (
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClasses}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...props}
                />
            )}

            {error && <span className="input-error-text">{error}</span>}
            {helperText && !error && <span className="input-helper-text">{helperText}</span>}
        </div>
    );
};

export default Input;
