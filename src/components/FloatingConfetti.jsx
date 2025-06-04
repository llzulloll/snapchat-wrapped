import React, { useEffect, useState } from 'react';

const CONFETTI_COUNT = 40;
const CONFETTI_SIZE = 16; // px
const SCREEN_PADDING = 0; // px
const COLORS = ['#FFD600', '#FFA500']; // yellow, orange

function getRandomPosition() {
    const width = window.innerWidth - CONFETTI_SIZE - SCREEN_PADDING;
    const height = window.innerHeight - CONFETTI_SIZE - SCREEN_PADDING;
    return {
        left: Math.random() * width,
        top: Math.random() * height,
    };
}

function getRandomDuration() {
    return 4 + Math.random() * 5; // 4-9 seconds
}

function getRandomShape() {
    return Math.random() > 0.5 ? '50%' : '20%'; // circle or rounded rectangle
}

const FloatingConfetti = () => {
    const [confetti, setConfetti] = useState(
        Array.from({ length: CONFETTI_COUNT }, () => ({
            ...getRandomPosition(),
            duration: getRandomDuration(),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            shape: getRandomShape(),
            rotate: Math.random() * 360,
        }))
    );

    useEffect(() => {
        const intervals = confetti.map((_, idx) =>
            setInterval(() => {
                setConfetti((prev) => {
                    const newConfetti = [...prev];
                    newConfetti[idx] = {
                        ...getRandomPosition(),
                        duration: getRandomDuration(),
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        shape: getRandomShape(),
                        rotate: Math.random() * 360,
                    };
                    return newConfetti;
                });
            }, 3500 + Math.random() * 4000)
        );
        return () => intervals.forEach(clearInterval);
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: -2 }}>
            {confetti.map((piece, idx) => (
                <div
                    key={idx}
                    style={{
                        position: 'absolute',
                        width: CONFETTI_SIZE,
                        height: CONFETTI_SIZE / (Math.random() > 0.5 ? 1 : 2),
                        left: piece.left,
                        top: piece.top,
                        background: piece.color,
                        borderRadius: piece.shape,
                        transition: `left ${piece.duration}s linear, top ${piece.duration}s linear, background 0.5s, border-radius 0.5s, transform 0.5s`,
                        transform: `rotate(${piece.rotate}deg)`,
                        opacity: 0.85,
                        boxShadow: `0 0 8px ${piece.color}55`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                />
            ))}
        </div>
    );
};

export default FloatingConfetti; 