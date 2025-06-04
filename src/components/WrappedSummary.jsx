
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Helper to format hour for display
export function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

// Helper to capitalize each word
export function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Hoisted and exported processSnapchatData function
export function processSnapchatData(data) {
    // Initialize stats object
    const stats = {
        topFriends: [],
        topGroupChats: [],
        snapsOverTime: [],
        monthlySnaps: {},
        hourlySnaps: Array(24).fill(0),
        streakInfo: { longest: 0, current: 0 },
        funFacts: [],
        callStats: {
            totalCalls: 0,
            totalCallDuration: 0,
            averageCallDuration: 0,
            callTypes: { audio: 0, video: 0 },
            callResults: { succeeded: 0, failed: 0, received: 0, initiated: 0 },
            networkStats: { wifi: 0, mobile: 0 },
            longestCall: 0,
            mostActiveCity: '',
            cityStats: {}
        },
        totalSnapsSent: 0,
        totalSnapsReceived: 0,
        totalSnapsSent1to1: 0,
        totalSnapsSentGroup: 0,
        totalSnapsReceived1to1: 0,
        totalSnapsReceivedGroup: 0,
    };
    // Initialize mediaCounts and dailySnaps
    stats.mediaCounts = {};
    stats.dailySnaps = {};

    // Track all group chat participants
    const groupChatParticipants = new Set();
    const groupChats = new Set();
    const friendStats = {};
    const groupChatStats = {};
    const conversationParticipants = new Map();
    const snapStats = {};

    try {
        // Process call history
        if (data["Outgoing Calls"] || data["Incoming Calls"]) {
            const allCalls = [
                ...(data["Outgoing Calls"] || []),
                ...(data["Incoming Calls"] || [])
            ];

            stats.callStats.totalCalls = allCalls.length;

            allCalls.forEach(call => {
                // Process call duration
                const duration = call["Length (sec)"] || 0;
                stats.callStats.totalCallDuration += duration;
                stats.callStats.longestCall = Math.max(stats.callStats.longestCall, duration);

                // Process call types
                if (call.Type === "AUDIO") {
                    stats.callStats.callTypes.audio++;
                } else if (call.Type === "VIDEO") {
                    stats.callStats.callTypes.video++;
                }

                // Process call results
                if (call.Result) {
                    const result = call.Result.toLowerCase();
                    if (result.includes("succeeded")) {
                        stats.callStats.callResults.succeeded++;
                    } else if (result.includes("failed")) {
                        stats.callStats.callResults.failed++;
                    } else if (result.includes("received")) {
                        stats.callStats.callResults.received++;
                    } else if (result.includes("initiated")) {
                        stats.callStats.callResults.initiated++;
                    }
                }

                // Process network stats
                if (call.Network) {
                    const network = call.Network.toLowerCase();
                    if (network === "wifi") {
                        stats.callStats.networkStats.wifi++;
                    } else if (network === "mobile") {
                        stats.callStats.networkStats.mobile++;
                    }
                }

                // Process city stats
                if (call.City) {
                    stats.callStats.cityStats[call.City] = (stats.callStats.cityStats[call.City] || 0) + 1;
                }
            });

            // Calculate average call duration
            if (stats.callStats.totalCalls > 0) {
                stats.callStats.averageCallDuration = Math.round(stats.callStats.totalCallDuration / stats.callStats.totalCalls);
            }

            // Find most active city
            const cityEntries = Object.entries(stats.callStats.cityStats);
            if (cityEntries.length > 0) {
                stats.callStats.mostActiveCity = cityEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
            }
        }

        // Flatten chat_history and snap_history if they are objects
        const chatEntries = Array.isArray(data.chat_history)
            ? data.chat_history
            : Object.values(data.chat_history || {}).flat();
        const snapEntries = Array.isArray(data.snap_history)
            ? data.snap_history
            : Object.values(data.snap_history || {}).flat();

        // Step 1: Detect the user's own username from 1:1 chats and snaps
        const senderCounts = {};
        chatEntries.forEach(chat => {
            const conversationTitle = chat["Conversation Title"];
            const isSender = chat.IsSender;
            const from = chat.From;
            if (isSender && from && (!conversationTitle || conversationTitle === null)) {
                senderCounts[from] = (senderCounts[from] || 0) + 1;
            }
        });
        snapEntries.forEach(snap => {
            const conversationTitle = snap["Conversation Title"];
            const isSender = snap.IsSender;
            const from = snap.From;
            if (isSender && from && (!conversationTitle || conversationTitle === null)) {
                senderCounts[from] = (senderCounts[from] || 0) + 1;
            }
        });
        // Find the most common sender as the user's username
        const userUsername = Object.entries(senderCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
        console.log('Detected user username:', userUsername);
        stats.userUsername = userUsername;

        // Build a set of all 1:1 chat partners
        const oneToOnePartners = new Set();
        chatEntries.forEach(chat => {
            const conversationTitle = chat["Conversation Title"];
            const isSender = chat.IsSender;
            const friend = chat.From;
            // Only consider 1:1 chats
            if (!conversationTitle || conversationTitle === null) {
                if (isSender && friend && friend !== userUsername) {
                    oneToOnePartners.add(friend);
                } else if (!isSender && friend && friend !== userUsername) {
                    oneToOnePartners.add(friend);
                }
            }
        });

        // Count 1:1 chat interactions (sent and received), excluding user's own username
        chatEntries.forEach(chat => {
            const conversationTitle = chat["Conversation Title"];
            const isSender = chat.IsSender;
            const friend = chat.From;
            // Only count 1:1 chats
            if (!conversationTitle || conversationTitle === null) {
                let otherUser = null;
                if (isSender && friend && friend !== userUsername) {
                    otherUser = friend;
                } else if (!isSender && friend && friend !== userUsername) {
                    otherUser = friend;
                }
                if (otherUser) {
                    friendStats[otherUser] = (friendStats[otherUser] || 0) + 1;
                }
            } else {
                // Group chat stats
                if (!isSender && friend && friend !== userUsername) {
                    groupChatStats[conversationTitle] = (groupChatStats[conversationTitle] || 0) + 1;
                }
            }
            // Track participants for group chat detection
            if (friend && conversationTitle) {
                if (!conversationParticipants.has(conversationTitle)) {
                    conversationParticipants.set(conversationTitle, new Set());
                }
                conversationParticipants.get(conversationTitle).add(friend);
            }
        });

        // For snaps, count all individual and group snaps accurately regardless of Conversation Title presence
        snapEntries.forEach(snap => {
            const isSender = snap.IsSender;
            const from = snap.From;
            const mediaType = snap["Media Type"];
            const conversationTitle = snap["Conversation Title"];
            // Ignore erased/status snaps
            if (mediaType !== "STATUSERASEDSNAPMESSAGE") {
                // Track media types
                stats.mediaCounts[mediaType] = (stats.mediaCounts[mediaType] || 0) + 1;
                // Track daily counts
                const snapDate = new Date(snap["Created"] || snap["Date"]);
                const dateKey = `${snapDate.getFullYear()}-${String(snapDate.getMonth() + 1).padStart(2, '0')}-${String(snapDate.getDate()).padStart(2, '0')}`;
                stats.dailySnaps[dateKey] = (stats.dailySnaps[dateKey] || 0) + 1;
                // Determine if this snap is a group snap by counting participants in Conversation Title, if available
                let isGroup = false;
                if (conversationTitle && conversationTitle !== null && conversationTitle.trim() !== "") {
                    // If Conversation Title exists, assume group if more than 2 participants, or if it's not a direct chat
                    // (This logic can be refined if you have more metadata)
                    isGroup = true;
                }
                // Sent snaps
                if (isSender) {
                    stats.totalSnapsSent++;
                    if (isGroup) {
                        stats.totalSnapsSentGroup++;
                    } else {
                        stats.totalSnapsSent1to1++;
                    }
                } else {
                    stats.totalSnapsReceived++;
                    if (isGroup) {
                        stats.totalSnapsReceivedGroup++;
                    } else {
                        stats.totalSnapsReceived1to1++;
                    }
                }
                // For top friends: only count 1:1 snaps, not from your own username
                // Count both sent and received for 1:1 snaps, regardless of Conversation Title
                if (!isGroup && from && from !== userUsername) {
                    snapStats[from] = (snapStats[from] || 0) + 1;
                }
            }
        });
        // Ensure totalSnaps is the sum of all sent and received snaps (including both 1:1 and group)
        stats.totalSnaps =
            stats.totalSnapsSent1to1 +
            stats.totalSnapsSentGroup +
            stats.totalSnapsReceived1to1 +
            stats.totalSnapsReceivedGroup;

        // Group chat detection for display
        conversationParticipants.forEach((participants, conversationTitle) => {
            if (participants.size > 2) {
                groupChats.add(conversationTitle);
                participants.forEach(participant => {
                    groupChatParticipants.add(participant);
                });
            }
        });

        // Get top 5 group chats for display
        stats.topGroupChats = Object.entries(groupChatStats)
            .filter(([name]) => name && name.trim() !== '')
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({
                name: name.trim() || 'Unnamed Group',
                count
            }));

        // Get top 5 friends from combined counts
        stats.topFriends = Object.entries(friendStats)
            .filter(([name]) => {
                const lowerName = name.toLowerCase();
                return lowerName !== 'teamsnapchat' && lowerName !== 'team snapchat';
            })
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count], index) => ({ name, count, rank: index + 1 }));
        console.log('Final top friends:', stats.topFriends);

        // Helper to calculate percentile using normal distribution
        function calculatePercentile(value, mean, stdDev) {
            // Calculate z-score
            const zScore = (value - mean) / stdDev;
            // Convert z-score to percentile using the cumulative normal distribution
            // Using an approximation of the normal CDF
            const percentile = 0.5 * (1 + Math.erf(zScore / Math.sqrt(2)));
            return Math.round(percentile * 100);
        }

        // Add erf function for normal distribution calculation
        Math.erf = function (x) {
            // Constants
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const p = 0.3275911;

            // Save the sign of x
            const sign = (x < 0) ? -1 : 1;
            x = Math.abs(x);

            // A&S formula 7.1.26
            const t = 1.0 / (1.0 + p * x);
            const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

            return sign * y;
        };

        // Process snap history for monthly breakdown
        snapEntries.forEach(snap => {
            const date = new Date(snap["Created"] || snap["Date"]);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            stats.monthlySnaps[monthYear] = (stats.monthlySnaps[monthYear] || 0) + 1;
        });

        // Convert monthly data to array with average snaps per day and sort by date
        stats.snapsOverTime = Object.entries(stats.monthlySnaps)
            .map(([month, count]) => {
                const dateObj = new Date(month + '-01');
                // days in that month
                const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
                return {
                    month: dateObj,
                    count,
                    avgPerDay: count / daysInMonth
                };
            })
            .sort((a, b) => a.month - b.month);

        // Process snap history for hourly breakdown
        snapEntries.forEach(snap => {
            const date = new Date(snap["Created"] || snap["Date"]);
            const hour = date.getHours();
            stats.hourlySnaps[hour]++;
        });

        // Compute fun facts after all stats are complete
        // Most active hour fact
        const mostActiveHourIndex = stats.hourlySnaps.indexOf(Math.max(...stats.hourlySnaps));
        const mostActiveHourFact = `You’re most active around ${formatHour(mostActiveHourIndex)}!`;

        // Most active day fact
        const dayEntries = Object.entries(stats.dailySnaps);
        let busiestDay = '', busiestCount = 0;
        dayEntries.forEach(([day, cnt]) => {
            if (cnt > busiestCount) { busiestCount = cnt; busiestDay = day; }
        });
        const busiestDayFormatted = busiestDay
            ? new Date(busiestDay + 'T00:00:00').toLocaleDateString()
            : '';
        const mostActiveDayFact = busiestDay
            ? `Your busiest day was ${busiestDayFormatted} with ${busiestCount} snaps!`
            : '';

        // Top media type fact
        const totalMedia = Object.values(stats.mediaCounts).reduce((sum, v) => sum + v, 0);
        let mediaMixFact = '';
        if (totalMedia > 0) {
            const [topType, topCount] = Object.entries(stats.mediaCounts)
                .reduce((a, b) => b[1] > a[1] ? b : a);
            const topPct = Math.round((topCount / totalMedia) * 100);
            mediaMixFact = `Your top media type is ${topType.toLowerCase()} (${topPct}% of snaps).`;
        }

        // Generate fun facts
        const snapPercentile = calculatePercentile(stats.totalSnaps, 2300, 500);
        stats.funFacts = [
            `You’re most active in ${capitalizeWords(stats.callStats.mostActiveCity) || 'your city'}!`,
            `You are more active than ${snapPercentile}% of Snapchat users!`,
            mostActiveHourFact,
            mostActiveDayFact,
            mediaMixFact
        ].filter(f => f);

        // Process snap history for monthly breakdown
        snapEntries.forEach(snap => {
            const date = new Date(snap["Created"] || snap["Date"]);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            stats.monthlySnaps[monthYear] = (stats.monthlySnaps[monthYear] || 0) + 1;
        });

        // Convert monthly data to array with average snaps per day and sort by date
        stats.snapsOverTime = Object.entries(stats.monthlySnaps)
            .map(([month, count]) => {
                const dateObj = new Date(month + '-01');
                // days in that month
                const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
                return {
                    month: dateObj,
                    count,
                    avgPerDay: count / daysInMonth
                };
            })
            .sort((a, b) => a.month - b.month);

        // Process snap history for hourly breakdown
        snapEntries.forEach(snap => {
            const date = new Date(snap["Created"] || snap["Date"]);
            const hour = date.getHours();
            stats.hourlySnaps[hour]++;
        });

    } catch (error) {
        console.error('Error processing data:', error);
    }


    return stats;
}

const WrappedSummary = () => {
    const [data, setData] = useState(null);
    const [stats, setStats] = useState({
        topFriends: [],
        topGroupChats: [],
        snapsOverTime: [],
        monthlySnaps: {},
        hourlySnaps: Array(24).fill(0),
        streakInfo: { longest: 0, current: 0 },
        funFacts: [],
        callStats: {
            totalCalls: 0,
            totalCallDuration: 0,
            averageCallDuration: 0,
            callTypes: { audio: 0, video: 0 },
            callResults: { succeeded: 0, failed: 0, received: 0, initiated: 0 },
            networkStats: { wifi: 0, mobile: 0 },
            longestCall: 0,
            mostActiveCity: '',
            cityStats: {}
        },
        totalSnapsSent: 0,
        totalSnapsReceived: 0,
        totalSnapsSent1to1: 0,
        totalSnapsSentGroup: 0,
        totalSnapsReceived1to1: 0,
        totalSnapsReceivedGroup: 0
    });

    useEffect(() => {
        const stored = localStorage.getItem("snapWrappedData");
        if (stored) {
            const parsed = JSON.parse(stored);
            setData(parsed);
            console.log("Loaded data from localStorage:", parsed);
        } else {
            console.warn("No Snapchat data found in localStorage.");
        }
    }, []);

    // Build username-to-display-name map from friendsList
    const friendsList = data?.friendsList || [];
    const usernameToDisplayName = {};
    friendsList.forEach(f => {
        usernameToDisplayName[f.Username] = f["Display Name"] || f.Username;
    });

    const totalFriends = friendsList.length;

    useEffect(() => {
        if (!data) {
            console.warn("No data received in WrappedSummary");
            return;
        }
        const processedStats = processSnapchatData(data);
        console.log('Processed stats:', processedStats);
        setStats(processedStats);
    }, [data]);

    const frequentLocations = data?.frequentLocations || [];
    const cityCounts = {};
    frequentLocations.forEach(loc => {
        if (loc.City) {
            const city = loc.City.toLowerCase();
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
    });

    const userProfile = data?.userProfile || {};
    const appProfile = userProfile["App Profile"] || {};
    const engagement = userProfile["Engagement"] || [];
    const breakdown = userProfile["Breakdown of Time Spent on App"] || [];
    const creationTime = appProfile["Creation Time"];
    // Calculate account age in years
    let accountAgeYears = null;
    if (creationTime) {
        const createdDate = new Date(creationTime.replace(' UTC', 'Z'));
        const now = new Date();
        accountAgeYears = now.getUTCFullYear() - createdDate.getUTCFullYear();
    }
    // Get some engagement stats
    const appOpens = engagement.find(e => e.Event === "Application Opens")?.Occurrences;
    // Total story-related views (Story Views + Snaps Viewed in a Story + Story Ads Viewed)
    const totalStoryViews = engagement
        .filter(e => ["Story Views", "Snaps Viewed in a Story", "Story Ads Viewed"].includes(e.Event))
        .reduce((sum, e) => sum + (e.Occurrences || 0), 0);
    // Parse time spent breakdown
    const timeBreakdown = breakdown.map(str => {
        const [section, percent] = str.split(": ");
        return {
            section: section === "Messaging" ? "Chatting" : section,
            percent: parseFloat(percent)
        };
    })
        .filter(item => item.section !== "Others")
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);

    // Helper to format month for display
    function formatMonth(date) {
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    // Guard: show loading message if data is not loaded yet
    if (!data) {
        return <p style={{ padding: 32 }}>Loading Snapchat Wrapped data...</p>;
    }

    return (
        <div style={{
            minHeight: "100vh",
            /* background: "linear-gradient(135deg, #FFFC00 60%, #fff700 100%)", */
            color: "#000",
            fontFamily: "'Segoe UI', 'Arial', sans-serif",
            padding: 32,
            position: "relative",
            overflow: "hidden"
        }}>
            <div style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                padding: 32,
                maxWidth: 900,
                margin: "0 auto",
                zIndex: 1,
                position: "relative"
            }}>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 700, textAlign: "center", marginBottom: 24, zIndex: 1 }}>
                    {stats.userUsername
                        ? `${usernameToDisplayName[stats.userUsername] || stats.userUsername}'s Snapchat Wrapped`
                        : 'Your Snapchat Wrapped'}
                </h2>
                <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555", marginTop: "-16px", marginBottom: "32px", zIndex: 1 }}>
                    Here's your past year of Snapchat!
                </p>
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 32,
                    zIndex: 1
                }}>
                    <div className="summary-card" style={{ background: "#fff", color: "#000", borderRadius: 16, padding: 24, minWidth: 220, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <h3>Most Active City</h3>
                        <p style={{ fontSize: "2rem", fontWeight: 700 }}>{capitalizeWords(stats.callStats.mostActiveCity)}</p>
                    </div>
                    <div className="summary-card" style={{ background: "#fff", color: "#000", borderRadius: 16, padding: 24, minWidth: 220, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <h3>Total Friends</h3>
                        <p style={{ fontSize: "2rem", fontWeight: 700 }}>{totalFriends}</p>
                    </div>
                    <div className="summary-card" style={{
                        background: "#fff",
                        color: "#000",
                        borderRadius: 16,
                        padding: 24,
                        minWidth: 220,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        textAlign: "center"
                    }}>
                        <h3>Stories Viewed</h3>
                        <p style={{ fontSize: "2rem", fontWeight: 700 }}>{totalStoryViews}</p>
                    </div>
                    {/* User Profile Summary Card */}
                    <div className="summary-card" style={{ background: "#fff", color: "#000", borderRadius: 16, padding: 24, minWidth: 220, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <h3>Your Snapchat Profile</h3>
                        {creationTime && <p style={{ fontSize: "1.2rem", margin: "4px 0" }}>Joined: {new Date(creationTime.replace(' UTC', 'Z')).toLocaleDateString()}</p>}
                        {accountAgeYears && <p style={{ fontSize: "1.2rem", margin: "4px 0" }}>Account Age: {accountAgeYears} years</p>}
                        {appOpens && <p style={{ fontSize: "1.2rem", margin: "4px 0" }}>App Opens: {appOpens}</p>}
                        {/* {typeof totalStoryViews === 'number' && (
                            <p>Stories Viewed: {totalStoryViews}</p>
                        )} */}
                    </div>
                    {/* Top 3 Most Used Features summary card */}
                    {timeBreakdown.length > 0 && (
                        <div className="summary-card" style={{
                            background: "#fff",
                            color: "#000",
                            borderRadius: 16,
                            padding: 24,
                            minWidth: 220,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            textAlign: "center"
                        }}>
                            <h3 style={{ marginBottom: 16 }}>Top 3 Features</h3>
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8
                            }}>
                                {timeBreakdown.map((tb, idx) => (
                                    <span key={idx} style={{ fontSize: "1.2rem", fontWeight: 500 }}>
                                        {tb.section}: {tb.percent.toFixed(2)}%
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 48, zIndex: 1 }}>
                    <h3 style={{ textAlign: "center", marginBottom: 24 }}>Top Friends</h3>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        maxWidth: 600,
                        margin: "0 auto"
                    }}>
                        {stats.topFriends.map((friend, index) => (
                            <div key={index} style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: 16,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        fontSize: "1.2rem",
                                        fontWeight: 700,
                                        color: "#FFFC00",
                                        background: "#000",
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "2px solid #FFFC00"
                                    }}>{index + 1}</div>
                                    <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>{usernameToDisplayName[friend.name] || friend.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 48, zIndex: 1 }}>
                    <h3 style={{ textAlign: "center", marginBottom: 24 }}>Top Group Chats</h3>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        maxWidth: 600,
                        margin: "0 auto"
                    }}>
                        {stats.topGroupChats.map((group, index) => (
                            <div key={index} style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: 16,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        fontSize: "1.2rem",
                                        fontWeight: 700,
                                        color: "#FFFC00",
                                        background: "#000",
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "2px solid #FFFC00"
                                    }}>{index + 1}</div>
                                    <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>{group.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Snap Activity Graph */}
                {stats.snapsOverTime.length > 0 && (
                    <div style={{ marginTop: 48, zIndex: 1 }}>
                        <h3 style={{ textAlign: "center", marginBottom: 24 }}>Your Snap Activity Over Time</h3>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            width: "100%",
                            padding: 0
                        }}>
                            {(() => {
                                // Compute 3-month moving average of avg snaps per day and find max for scaling
                                const smoothData = stats.snapsOverTime.map((d, i, arr) => {
                                    const window = [
                                        arr[i - 1]?.avgPerDay,
                                        d.avgPerDay,
                                        arr[i + 1]?.avgPerDay
                                    ].filter(v => v !== undefined);
                                    const smoothed = window.reduce((sum, v) => sum + v, 0) / window.length;
                                    // Apply manual downward adjustment for the last three months
                                    const n = arr.length;
                                    let adjusted = smoothed;
                                    let k = .3;
                                    if (i >= n - 4) {
                                        adjusted = adjusted * (k - .1); // reduce height by 50%
                                    }
                                    return { ...d, smoothed, adjusted };
                                });
                                const maxSmooth = Math.max(...smoothData.map(d => d.adjusted));
                                return (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        height: 200,
                                        gap: "4px",
                                        borderBottom: "2px solid #000",
                                        paddingBottom: "8px",
                                        width: "100%",
                                        boxSizing: "border-box",
                                    }}>
                                        {smoothData.map((data, index) => {
                                            // Use square-root scaling to compress skew
                                            const height = (Math.sqrt(data.adjusted) / Math.sqrt(maxSmooth)) * 180;
                                            return (
                                                <div key={index} style={{
                                                    flex: 1,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}>
                                                    <div style={{
                                                        width: "100%",
                                                        height: `${height}px`,
                                                        background: "#FFFC00",
                                                        borderRadius: "4px 4px 0 0",
                                                        transition: "height 0.3s ease"
                                                    }} />
                                                    <div style={{
                                                        fontSize: "0.8rem",
                                                        transform: "rotate(-45deg)",
                                                        transformOrigin: "top left",
                                                        marginLeft: "8px",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {formatMonth(data.month)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "0 16px",
                                color: "#666",
                                fontSize: "0.9rem"
                            }}>
                                <span>Snaps per month</span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Time of Day Activity Graph */}
                <div style={{ marginTop: 48, zIndex: 1 }}>
                    <h3 style={{ textAlign: "center", marginBottom: 24 }}>When You're Most Active</h3>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        width: "100%",
                        padding: 0
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "flex-end",
                            height: 200,
                            gap: "2px",
                            borderBottom: "2px solid #000",
                            paddingBottom: "8px",
                            width: "100%",
                            boxSizing: "border-box",
                        }}>
                            {stats.hourlySnaps.map((count, hour) => {
                                const maxCount = Math.max(...stats.hourlySnaps);
                                const height = (count / maxCount) * 180;
                                return (
                                    <div key={hour} style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}>
                                        <div style={{
                                            width: "100%",
                                            height: `${height}px`,
                                            background: "#FFFC00",
                                            borderRadius: "4px 4px 0 0",
                                            transition: "height 0.3s ease"
                                        }} />
                                        <div style={{
                                            fontSize: "0.7rem",
                                            transform: "rotate(-45deg)",
                                            transformOrigin: "top left",
                                            marginLeft: "8px",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {formatHour(hour)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0 16px",
                            color: "#666",
                            fontSize: "0.9rem"
                        }}>
                            <span>Snaps by hour</span>
                            <span>24-hour activity</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 48, textAlign: "center", zIndex: 1 }}>
                    <h3 style={{ marginBottom: 24 }}>Fun Facts</h3>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        maxWidth: 600,
                        margin: "0 auto"
                    }}>
                        {stats.funFacts.map((fact, index) => (
                            <div key={index} style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: 16,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                            }}>
                                <p style={{ fontSize: "1.2rem", margin: 0 }}>{fact}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 48, zIndex: 1 }}>
                    <h3 style={{ textAlign: "center", marginBottom: 24 }}>Call Statistics</h3>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        maxWidth: 600,
                        margin: "0 auto"
                    }}>
                        <div style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}>
                            <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>Audio Calls</span>
                            <span style={{ fontSize: "1.2rem", color: "#666" }}>{stats.callStats.callTypes.audio}</span>
                        </div>
                        <div style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}>
                            <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>Video Calls</span>
                            <span style={{ fontSize: "1.2rem", color: "#666" }}>{stats.callStats.callTypes.video}</span>
                        </div>
                        <div style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}>
                            <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>WiFi Calls</span>
                            <span style={{ fontSize: "1.2rem", color: "#666" }}>{stats.callStats.networkStats.wifi}</span>
                        </div>
                        <div style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}>
                            <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>Mobile Calls</span>
                            <span style={{ fontSize: "1.2rem", color: "#666" }}>{stats.callStats.networkStats.mobile}</span>
                        </div>
                    </div>
                </div>



            </div>
        </div>
    );
};

export default WrappedSummary; 