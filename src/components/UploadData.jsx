import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SnapchatGhost = ({ style }) => (
    <svg
        viewBox="0 0 512 512"
        width="40"
        height="40"
        style={style}
        xmlns="http://www.w3.org/2000/svg"
    >
        <g>
            <path d="M256 32c-88.2 0-160 71.8-160 160 0 44.2 18.1 84.2 47.7 112.2-2.2 2.7-4.3 5.5-6.3 8.4-8.2 11.7-15.2 24.2-20.7 37.2-2.7 6.2-5.1 12.5-7.2 18.9-1.2 3.5-2.3 7-3.3 10.6-1.2 4.2-2.3 8.5-3.2 12.8-1.2 5.7-2.2 11.5-2.9 17.3-1.1 8.7-1.7 17.5-1.7 26.3 0 8.8.6 17.6 1.7 26.3.7 5.8 1.7 11.6 2.9 17.3.9 4.3 2 8.6 3.2 12.8 1 3.6 2.1 7.1 3.3 10.6 2.1 6.4 4.5 12.7 7.2 18.9 5.5 13 12.5 25.5 20.7 37.2 2 2.9 4.1 5.7 6.3 8.4C95.9 435.8 32 353.2 32 256 32 114.6 114.6 32 256 32z" fill="#fff" stroke="#000" strokeWidth="16" />
            <path d="M256 32c141.4 0 224 82.6 224 224 0 97.2-63.9 179.8-151.7 207.8 2.2 2.7 4.3 5.5 6.3 8.4 8.2 11.7 15.2 24.2 20.7 37.2 2.7 6.2 5.1 12.5 7.2 18.9 1.2 3.5 2.3 7 3.3 10.6 1.2 4.2 2.3 8.5 3.2 12.8 1.2 5.7 2.2 11.5 2.9 17.3 1.1 8.7 1.7 17.5 1.7 26.3 0 8.8-.6 17.6-1.7 26.3-.7 5.8-1.7 11.6-2.9 17.3-.9 4.3-2 8.6-3.2 12.8-1 3.6-2.1 7.1-3.3 10.6-2.1 6.4-4.5 12.7-7.2 18.9-5.5 13-12.5 25.5-20.7 37.2-2 2.9-4.1 5.7-6.3 8.4C416.1 435.8 480 353.2 480 256c0-141.4-82.6-224-224-224z" fill="#fff" stroke="#000" strokeWidth="16" />
            <ellipse cx="200" cy="220" rx="18" ry="28" fill="#000" />
            <ellipse cx="312" cy="220" rx="18" ry="28" fill="#000" />
            <path d="M200 320 Q256 370 312 320" stroke="#000" strokeWidth="12" fill="none" />
        </g>
    </svg>
);

const instructions = [
    "Go to your Snapchat app or https://accounts.snapchat.com and log in.",
    "Navigate to 'My Data' and request your data archive.",
    "Wait for Snapchat to email you a download link (it may take a few minutes).",
    "Download and extract the ZIP file to your computer.",
    "Return here and upload the folder containing your Snapchat data files."
];

const UploadData = () => {
    const fileInputRef = useRef();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            setError('No files selected');
            return;
        }

        console.log('Files selected:', files.length);
        Array.from(files).forEach(file => {
            console.log('File:', file.name, 'Size:', file.size);
        });

        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            const data = await processFiles(files);
            console.log('Final processed data being sent to summary:', data);
            // Persist to localStorage under key snapWrappedData
            localStorage.setItem("snapWrappedData", JSON.stringify(data));
            // Pass in router state under data key
            navigate('/slideshow', { state: { data } });
        } catch (err) {
            console.error('Error in handleFileUpload:', err);
            setError(err.message || 'Error processing files. Please make sure you uploaded the correct Snapchat data folder.');
        } finally {
            setIsLoading(false);
        }
    };

    const processFiles = async (files) => {
        const processedData = {
            chat_history: [],
            streaks: [],
            "Outgoing Calls": [],
            "Incoming Calls": [],
            "Completed Calls": [],
            snap_history: [],
            friendsList: [],
            frequentLocations: [],
            userProfile: {},
            "Your Story Views": []
        };

        const totalFiles = files.length;
        let processedFiles = 0;
        let processedAnyFile = false;

        console.log('Total files to process:', totalFiles);

        for (const file of files) {
            console.log('Processing file:', file.name);

            if (!file.name.endsWith('.json')) {
                console.log('Skipping non-JSON file:', file.name);
                continue;
            }

            try {
                const content = await readFileAsText(file);
                console.log('File content length:', content.length);

                let jsonData;
                try {
                    jsonData = JSON.parse(content);
                    console.log('Successfully parsed JSON for:', file.name);
                } catch (parseError) {
                    console.error('JSON parse error for file:', file.name, parseError);
                    continue;
                }

                // Debug: log number of keys and total entries for chat_history and snap_history
                if (file.name === 'chat_history.json') {
                    const keys = Object.keys(jsonData);
                    const totalEntries = Object.values(jsonData).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
                    console.log(`[DEBUG] chat_history.json: keys=${keys.length}, totalEntries=${totalEntries}`);
                }
                if (file.name === 'snap_history.json') {
                    const keys = Object.keys(jsonData);
                    const totalEntries = Object.values(jsonData).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
                    console.log(`[DEBUG] snap_history.json: keys=${keys.length}, totalEntries=${totalEntries}`);
                }

                // Process based on filename
                if (file.name === 'chat_history.json') {
                    console.log('Processing chat history data');
                    // Flatten all message arrays from the UUID keys
                    const allMessages = Object.values(jsonData).flat();
                    processedData.chat_history = allMessages;
                    processedAnyFile = true;

                    console.log('Processing snap history data');
                    // Flatten all snap arrays from the UUID keys
                    const allSnaps = Object.values(jsonData).flat();
                    processedData.snap_history = allSnaps;
                    processedAnyFile = true;
                } else if (file.name === 'snap_history.json') {
                    // Flatten all snap arrays from the UUID keys
                    const allSnaps = Object.values(jsonData).flat();
                    processedData.snap_history = allSnaps;
                    processedAnyFile = true;
                    // Calculate most active snap day
                    // Calculate most active snap day
                    const snapDates = allSnaps.map(snap => {
                        const date = new Date(snap.Created || snap["Created UTC"]);
                        return isNaN(date) ? null : date.toISOString().split("T")[0];
                    }).filter(Boolean);

                    const dateCountMap = {};
                    for (const date of snapDates) {
                        dateCountMap[date] = (dateCountMap[date] || 0) + 1;
                    }

                    let mostActiveDay = null;
                    let maxSnaps = 0;
                    for (const [date, count] of Object.entries(dateCountMap)) {
                        if (count > maxSnaps) {
                            mostActiveDay = date;
                            maxSnaps = count;
                        }
                    }

                    processedData.mostActiveSnapDay = { date: mostActiveDay, snapCount: maxSnaps };
                } else if (file.name === 'talk_history.json') {
                    console.log('Processing talk history data');
                    if (jsonData["Outgoing Calls"]) {
                        processedData["Outgoing Calls"] = jsonData["Outgoing Calls"];
                        processedAnyFile = true;
                    }
                    if (jsonData["Incoming Calls"]) {
                        processedData["Incoming Calls"] = jsonData["Incoming Calls"];
                        processedAnyFile = true;
                    }
                } else if (file.name === 'friends.json') {
                    console.log('Processing friends list');
                    try {
                        const friendsData = JSON.parse(content);
                        processedData.friendsList = friendsData.Friends || [];
                        processedAnyFile = true;
                    } catch (e) {
                        console.error('Error parsing friends.json:', e);
                    }
                } else if (file.name === 'location_history.json') {
                    console.log('Processing location history');
                    try {
                        const locationData = JSON.parse(content);
                        processedData.frequentLocations = locationData["Frequent Locations"] || [];
                        processedAnyFile = true;
                    } catch (e) {
                        console.error('Error parsing location_history.json:', e);
                    }
                } else if (file.name === 'user_profile.json') {
                    console.log('Processing user profile');
                    try {
                        const userProfileData = JSON.parse(content);
                        processedData.userProfile = userProfileData;
                        processedAnyFile = true;
                    } catch (e) {
                        console.error('Error parsing user_profile.json:', e);
                    }
                } else if (file.name === 'story_history.json') {
                    console.log('Processing story history data');
                    try {
                        const storyData = JSON.parse(content);
                        processedData["Your Story Views"] = storyData["Your Story Views"] || [];
                        processedAnyFile = true;
                    } catch (e) {
                        console.error('Error parsing story_history.json:', e);
                    }
                }

                processedFiles++;
                setProgress(Math.round((processedFiles / totalFiles) * 100));
            } catch (e) {
                console.error('Error processing file:', file.name, e);
            }
        }

        // Log detailed processing results
        console.log('Processed data summary:', {
            chatHistoryLength: processedData.chat_history.length,
            streaksLength: processedData.streaks.length,
            outgoingCallsLength: processedData["Outgoing Calls"].length,
            incomingCallsLength: processedData["Incoming Calls"].length,
            completedCallsLength: processedData["Completed Calls"].length,
            snapHistoryLength: processedData.snap_history.length
        });

        // Validate the processed data
        if (!processedAnyFile) {
            throw new Error('No valid data files were processed. Please make sure you selected the correct folder containing Snapchat data JSON files.');
        }

        return processedData;
    };

    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!event.target.result) {
                    reject(new Error('Empty file content'));
                    return;
                }
                resolve(event.target.result);
            };
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(new Error('Error reading file: ' + error.message));
            };
            reader.readAsText(file);
        });
    };

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
            {/* Floating ghost in the bottom left */}
            <SnapchatGhost style={{ position: "absolute", bottom: 32, left: 32, opacity: 0.7, zIndex: 0, animation: "floatUpload 7s ease-in-out infinite" }} />
            <style>{`
              @keyframes floatUpload {
                0% { transform: translateY(0); }
                50% { transform: translateY(-18px) scale(1.04); }
                100% { transform: translateY(0); }
              }
              .upload-btn:hover {
                background: #fff700;
                color: #000;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                transform: scale(1.05);
              }
            `}</style>
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
                <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16, zIndex: 1 }}>Upload Your Snapchat Data</h2>
                <ul style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", maxWidth: 420, zIndex: 1, fontSize: "1rem" }}>
                    {instructions.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: 10 }}>{step}</li>
                    ))}
                </ul>
                <input
                    type="file"
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                />
                <button
                    className="upload-btn"
                    style={{
                        background: "#000",
                        color: "#FFFC00",
                        border: "none",
                        borderRadius: 8,
                        padding: "0.75rem 2rem",
                        fontSize: "1rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        zIndex: 1,
                        opacity: isLoading ? 0.7 : 1,
                        pointerEvents: isLoading ? "none" : "auto"
                    }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                    {isLoading ? "Processing..." : "Upload Folder"}
                </button>
                {isLoading && (
                    <div style={{
                        width: "100%",
                        marginTop: 16,
                        background: "#f0f0f0",
                        borderRadius: 8,
                        overflow: "hidden"
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: 8,
                            background: "#FFFC00",
                            transition: "width 0.3s ease-in-out"
                        }} />
                    </div>
                )}
                {error && (
                    <p style={{
                        color: "#ff4444",
                        marginTop: 16,
                        textAlign: "center",
                        background: "rgba(255,68,68,0.1)",
                        padding: "8px 16px",
                        borderRadius: 8
                    }}>
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default UploadData; 