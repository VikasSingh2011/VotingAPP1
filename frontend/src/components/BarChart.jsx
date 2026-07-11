import React, { useEffect, useRef } from 'react';

const BarChart = ({ candidates }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!candidates || candidates.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size for high-DPI screens
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const maxVotes = Math.max(...candidates.map(c => c.voteCount || 0), 1);
        const padding = { top: 20, right: 20, bottom: 50, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = Math.min(60, (chartWidth / candidates.length) - 16);
        const gap = (chartWidth - barWidth * candidates.length) / (candidates.length + 1);

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Gridlines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();

            // Y-axis labels
            const label = Math.round(maxVotes - (maxVotes / 4) * i);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(label, padding.left - 8, y + 4);
        }

        // Bars + labels
        candidates.forEach((candidate, i) => {
            const votes = candidate.voteCount || 0;
            const barHeight = (votes / maxVotes) * chartHeight;
            const x = padding.left + gap * (i + 1) + barWidth * i;
            const y = padding.top + chartHeight - barHeight;

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, i === 0 ? '#818cf8' : 'rgba(79,70,229,0.8)');
            gradient.addColorStop(1, i === 0 ? '#4f46e5' : 'rgba(79,70,229,0.3)');

            // Rounded bar
            const radius = 6;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, y + barHeight);
            ctx.lineTo(x, y + barHeight);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Vote count on top
            ctx.fillStyle = '#a5b4fc';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(votes, x + barWidth / 2, y - 6);

            // Candidate name
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            const name = candidate.name.length > 10 ? candidate.name.substring(0, 9) + '…' : candidate.name;
            ctx.fillText(name, x + barWidth / 2, padding.top + chartHeight + 20);
            
            // Party
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Inter, sans-serif';
            const party = candidate.party.length > 10 ? candidate.party.substring(0, 9) + '…' : candidate.party;
            ctx.fillText(party, x + barWidth / 2, padding.top + chartHeight + 36);
        });

    }, [candidates]);

    return (
        <div style={{ width: '100%', height: '260px', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default BarChart;
