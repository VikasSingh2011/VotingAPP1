import React from 'react';
import { getPartySymbol } from '../utils/partySymbols';

const PartySymbol = ({ symbol, size = 40, showLabel = false }) => {
    const option = getPartySymbol(symbol);
    const src = `/party-symbols/${option.id}.svg`;

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <span
                style={{
                    width: size,
                    height: size,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    flex: '0 0 auto'
                }}
                title={option.label}
            >
                <img
                    src={src}
                    alt={option.label}
                    style={{ width: '82%', height: '82%', objectFit: 'contain' }}
                    onError={(event) => {
                        event.currentTarget.style.display = 'none';
                    }}
                />
            </span>
            {showLabel && <span>{option.label}</span>}
        </span>
    );
};

export default PartySymbol;
