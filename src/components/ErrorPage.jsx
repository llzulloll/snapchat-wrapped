import React from "react";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontFamily: "'Segoe UI', 'Arial', sans-serif"
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
                <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>Oops! Something went wrong.</h2>
                <p style={{ maxWidth: 400, textAlign: "center", marginBottom: 24 }}>
                    We couldn't process your request. Please try again or go back to the home page.
                </p>
                <button
                    style={{
                        background: "#000",
                        color: "#FFFC00",
                        border: "none",
                        borderRadius: 8,
                        padding: "0.75rem 2rem",
                        fontSize: "1rem",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                    onClick={() => navigate("/")}
                >
                    Go Home
                </button>
            </div>
        </div>
    );
};

export default ErrorPage; 