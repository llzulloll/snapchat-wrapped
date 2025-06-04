// SlideShow.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './SlideShow.css';
import { formatHour } from "./WrappedSummary";
import HourlyChart from "./HourlyChart";
import { processSnapchatData } from "./WrappedSummary";

function SlideShow({ slides, onDone }) {
    const [index, setIndex] = useState(0);

    const goNext = () => {
        if (index === slides.length - 1) {
            onDone && onDone();
        } else {
            setIndex(i => i + 1);
        }
    };
    const goPrev = () => {
        if (index > 0) setIndex(i => i - 1);
    };

    const { title, content, footnote } = slides[index];

    return (
        <div className="slideshow-container">
            <div className="slideshow">
                <button onClick={goPrev} className="nav prev" disabled={index === 0}>‹</button>
                <div className="slide">
                    <h2>{title}</h2>
                    <div className="slide-content">{content}</div>
                    <p className="footnote">{footnote}</p>
                </div>
                <button onClick={goNext} className="nav next">
                    {index === slides.length - 1 ? "Done" : "›"}
                </button>
            </div>
        </div>
    );
}

export default function SlideshowPage() {
    const navigate = useNavigate();
    const locationState = useLocation().state || {};
    const data = locationState.data;
    if (!data) {
        // if someone lands here without data, go back to Upload
        navigate("/upload");
        return null;
    }
    // Derive processedStats from raw data
    const processedStats = processSnapchatData(data);
    // Build usernameToDisplayName map
    const friendsList = data.friendsList || [];
    const usernameToDisplayName = {};
    friendsList.forEach(f => {
        usernameToDisplayName[f.Username] = f["Display Name"] || f.Username;
    });
    // Compute timeBreakdown from userProfile
    const breakdown = data.userProfile?.["Breakdown of Time Spent on App"] || [];
    const timeBreakdown = breakdown
        .map(str => {
            const [section, percent] = str.split(": ");
            return {
                section: section === "Messaging" ? "Chatting" : section,
                percent: parseFloat(percent)
            };
        })
        .filter(item => item.section !== "Others")
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);

    const slides = [
        {
            key: "top-friends",
            title: "Your Top 5 Friends",
            content: (
                <ul style={{ listStyle: "none", padding: 0, textAlign: "left" }}>
                    {processedStats.topFriends.slice(0, 5).map(f => (
                        <li key={f.name}>
                            {usernameToDisplayName[f.name] || f.name}: {f.count} chats
                        </li>
                    ))}
                </ul>
            ),
            footnote: "Hope you still talk to them all lol 😉"
        },
        {
            key: "map-usage",
            title: "Map Feature Usage",
            content: (
                <p>
                    You spent{" "}
                    {timeBreakdown.find(t => t.section === "Map")?.percent.toFixed(1) ||
                        0}
                    % of your time on the Snap Map.
                </p>
            ),
            footnote: "Oh—doing a bit of stalking, are we? 👀"
        },
        {
            key: "activity-heatmap",
            title: "When You’re Most Active",
            content: <HourlyChart hourlySnaps={processedStats.hourlySnaps} />,
            footnote: "Night owl or early bird? 🦉🌅"
        },
        {
            key: "fun-facts",
            title: "Fun Facts",
            content: processedStats.funFacts.map((fact, i) => <p key={i}>{fact}</p>),
            footnote: "And that’s not even half of it!"
        }
    ];

    return (
        <SlideShow
            slides={slides}
            onDone={() =>
                navigate("/loading", {
                    state: { next: "/wrapped" }
                })
            }
        />
    );
}