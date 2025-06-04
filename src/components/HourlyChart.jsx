// src/components/HourlyChart.jsx
import React from 'react';
import { formatHour } from './WrappedSummary'; // or wherever your helper lives

export default function HourlyChart({ hourlySnaps }) {
    // find the largest count so we can scale all bars relative to it
    const maxCount = Math.max(...hourlySnaps, 1);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: 200,
                gap: '2px',
                borderBottom: '2px solid #000',
                paddingBottom: 8,
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            {hourlySnaps.map((count, hour) => {
                const height = (count / maxCount) * 180;
                return (
                    <div
                        key={hour}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: `${height}px`,
                                background: '#FFFC00',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease',
                            }}
                        />
                        <div
                            style={{
                                fontSize: '0.7rem',
                                transform: 'rotate(-45deg)',
                                transformOrigin: 'top left',
                                marginLeft: '8px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {formatHour(hour)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}