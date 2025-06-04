import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontFamily: "'Segoe UI', 'Arial', sans-serif",
            position: "relative",
            overflow: "hidden"
        }}>
            <div style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                padding: 32,
                maxWidth: 500,
                margin: "0 auto",
                zIndex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}>
                <h1 style={{ fontSize: "3rem", fontWeight: 700, zIndex: 1 }}>Snapchat Wrapped</h1>
                <p style={{ fontSize: "1.25rem", maxWidth: 400, textAlign: "center", marginBottom: 32, zIndex: 1 }}>
                    See your year on Snapchat! Upload your data and get a beautiful, personalized summary of your snaps, chats, and more.
                </p>

                <button onClick={() => navigate("/upload")}>Upload Data</button>

            </div>
        </div>
    );
};

export default LandingPage;