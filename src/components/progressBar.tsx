'use client';

import { IProgress } from '@/store/selectors';
import React from 'react';

interface ProgressBarProps extends IProgress {}

const getColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-600';
    if (percentage < 60) return 'bg-yellow-500';
    if (percentage < 80) return 'bg-lime-500';
    if (percentage < 100) return 'bg-lime-600';
    return 'bg-green-600';
};

const ProgressBar: React.FC<ProgressBarProps> = ({ label, uploadingPercentage, processingPercentage, status }) => {
    let percentage: number = 0 || (uploadingPercentage as number); // Revert after simulation test

    if (status === 'uploading' || status === 'finished') {
        percentage = uploadingPercentage as number;
    }

    if (status === 'processing' || status === 'processing_finished') {
        percentage = processingPercentage as number;
    }

    return (
        <div className="w-full p-1">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-200">
                    {label} {'  ('}
                    {status}
                    {')'}
                </span>
                <span className="text-sm font-medium text-gray-200">{`${percentage <= 100 ? percentage : 100}%`}</span>
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
