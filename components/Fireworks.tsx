import React from 'react';

const fireworksCount = 40; // Increased for a fuller effect
const colors = ['#FFC700', '#FF3D77', '#00BFFF', '#ADFF2F', '#BA55D3', '#FF8C00'];

const Fireworks: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: fireworksCount }).map((_, i) => {
                const style = {
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${3 + Math.random() * 4}s`, // Adjusted duration for falling
                    animationDelay: `${Math.random() * 5}s`,
                    '--firework-color': colors[i % colors.length]
                } as React.CSSProperties;

                return <div key={i} className="confetti" style={style} />;
            })}
        </div>
    );
};

export default Fireworks;