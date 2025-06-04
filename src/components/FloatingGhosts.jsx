import React, { useEffect, useState } from 'react';

const GHOST_COUNT = 15;
const GHOST_SIZE = 100; // px
const SCREEN_PADDING = 0; // px

function getRandomPosition() {
    const width = window.innerWidth - GHOST_SIZE - SCREEN_PADDING;
    const height = window.innerHeight - GHOST_SIZE - SCREEN_PADDING;
    return {
        left: Math.random() * width,
        top: Math.random() * height,
    };
}

function getRandomDuration() {
    return 3 + Math.random() * 4; // 3-7 seconds
}

const FloatingGhosts = () => {
    const [ghosts, setGhosts] = useState(
        Array.from({ length: GHOST_COUNT }, () => ({
            ...getRandomPosition(),
            duration: getRandomDuration(),
        }))
    );

    useEffect(() => {
        const intervals = ghosts.map((_, idx) =>
            setInterval(() => {
                setGhosts((prev) => {
                    const newGhosts = [...prev];
                    newGhosts[idx] = {
                        ...getRandomPosition(),
                        duration: getRandomDuration(),
                    };
                    return newGhosts;
                });
            }, 3500 + Math.random() * 4000)
        );
        return () => intervals.forEach(clearInterval);
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: -1 }}>
            {ghosts.map((ghost, idx) => (
                <img
                    key={idx}
                    src={process.env.PUBLIC_URL + '/ghost.png'}
                    alt="Ghost"
                    style={{
                        position: 'absolute',
                        width: GHOST_SIZE,
                        height: GHOST_SIZE - 25,
                        left: ghost.left,
                        top: ghost.top,
                        transition: `left ${ghost.duration}s linear, top ${ghost.duration}s linear`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        opacity: 0.85,
                    }}
                />
            ))}
        </div>
    );
};

export default FloatingGhosts; 