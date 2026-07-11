export const PARTY_SYMBOL_OPTIONS = [
    { id: 'bjp-lotus', label: 'BJP - Lotus', legacy: ['🪷'] },
    { id: 'inc-hand', label: 'Congress - Hand', legacy: ['✋'] },
    { id: 'sp-bicycle', label: 'Samajwadi Party - Bicycle', legacy: ['🚲'] },
    { id: 'aap-broom', label: 'AAP - Broom', legacy: ['🧹'] },
    { id: 'bsp-elephant', label: 'BSP - Elephant', legacy: ['🐘'] },
    { id: 'shiv-sena-bow-arrow', label: 'Shiv Sena - Bow & Arrow', legacy: ['🏹'] },
    { id: 'rjd-lantern', label: 'RJD - Lantern', legacy: ['🏮'] },
    { id: 'ncp-clock', label: 'NCP - Clock', legacy: ['⏰'] },
    { id: 'cpi-paddy', label: 'CPI - Ears of Corn', legacy: ['🌾'] },
    { id: 'independent-diya', label: 'Independent - Lamp', legacy: ['🪔', '🔥'] },
    { id: 'nota', label: 'NOTA', legacy: ['🌳'] }
];

const symbolByValue = PARTY_SYMBOL_OPTIONS.reduce((map, option) => {
    map[option.id] = option;
    option.legacy.forEach(value => {
        map[value] = option;
    });
    return map;
}, {});

export const DEFAULT_PARTY_SYMBOL = PARTY_SYMBOL_OPTIONS[0].id;

export const getPartySymbol = (value) => {
    return symbolByValue[value] || {
        id: value || 'nota',
        label: value || 'Candidate symbol',
        legacy: []
    };
};
