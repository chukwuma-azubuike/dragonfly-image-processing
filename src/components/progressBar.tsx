'use client';

import { IProgress } from '@/store/selectors';
import React from 'react';

interface ProgressBarProps extends Partial<IProgress> {
    file?: File;
}

const getColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-600';
    if (percentage < 60) return 'bg-yellow-500';
    if (percentage < 80) return 'bg-lime-500';
    if (percentage < 100) return 'bg-lime-600';
    return 'bg-green-600';
};

const ProgressBar: React.FC<ProgressBarProps> = ({ label, uploadingPercentage, status, file }) => {
    let percentage: number = uploadingPercentage || 0;

    return (
        <div className="w-full p-1">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-200 truncate w-9/12">{label || file?.name}</span>
                <span className="text-sm font-medium text-gray-200 text-right w-max">
                    {'  ('}
                    {status || 'queued'}
                    {')'} {`${percentage <= 100 ? percentage : 100}%`}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                    className={`h-4 rounded-full ${getColor(percentage)}`}
                    style={{
                        width: percentage <= 100 ? `${percentage}%` : '100%',
                        transition: 'width 0.5s ease-in-out',
                    }}
                />
            </div>
        </div>
    );
};

export default React.memo(ProgressBar);
