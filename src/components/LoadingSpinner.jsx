import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ghostConfigs = [15]
// Simple confetti animation using canvas
const Confetti = () => {
    const canvasRef = useRef();
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 6 + 4,
            d: Math.random() * 80 + 40,
            color: `hsl(${Math.random() * 360}, 90%, 60%)`,
            tilt: Math.random() * 10 - 10,
            tiltAngle: 0,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05
        }));
        let angle = 0;
        let animationFrameId;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            angle += 0.01;
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
                p.x += Math.sin(angle);
                p.tiltAngle += p.tiltAngleIncremental;
                p.tilt = Math.sin(p.tiltAngle) * 15;
                if (p.y > window.innerHeight) {
                    p.x = Math.random() * window.innerWidth;
                    p.y = -10;
                }
                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + 10);
                ctx.stroke();
            }
            animationFrameId = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);
    return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 2 }} />;
};

const LoadingSpinner = () => {
    const navigate = useNavigate();
    const { next } = useLocation().state || {};

    useEffect(() => {
        const timer = setTimeout(() => navigate(next || "/wrapped"), 1500);
        return () => clearTimeout(timer);
    }, [navigate, next]);

    return (
        <div style={{
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontFamily: "'Segoe UI', 'Arial', sans-serif"
        }}>
            {/* Animated Ghosts */}
            {ghostConfigs.map((cfg, i) => (
                <img
                    key={i}
                    src="/snapchat-ghost.png"
                    alt="ghost"
                    style={{
                        position: "absolute",
                        zIndex: 0,
                        opacity: cfg.opacity,
                        width: cfg.size,
                        height: cfg.size,
                        ...cfg,
                        animation: `${cfg.anim} ${5 + (i % 5)}s ease-in-out infinite`,
                        pointerEvents: 'none',
                    }}
                />
            ))}
            <Confetti />
            {/* Spinner and message */}
            <div style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                padding: 32,
                maxWidth: 400,
                margin: "0 auto",
                zIndex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}>
                <div style={{
                    width: 64,
                    height: 64,
                    border: "8px solid #000",
                    borderTop: "8px solid #FFFC00",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ marginTop: 32, fontSize: "1.25rem", fontWeight: 500, textShadow: "0 2px 8px #fff700" }}>
                    Snapping your stats together...
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;