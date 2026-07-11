import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
    const [isLight, setIsLight] = useState(() => {
        return localStorage.getItem('theme') === 'light';
    });

    useEffect(() => {
        if (isLight) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    }, [isLight]);

    return (
        <button
            type="button"
            onClick={() => setIsLight(!isLight)}
            style={{
                background: 'rgba(128,128,128,0.1)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '6px 12px',
                color: 'inherit',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                fontFamily: 'Inter, sans-serif',
                outline: 'none'
            }}
        >
            {isLight ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
    );
};

export default ThemeToggle;
