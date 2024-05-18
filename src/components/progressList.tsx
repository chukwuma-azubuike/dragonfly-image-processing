'use client';

import React from 'react';
import ProgressBar from './progressBar';
import { IProgress } from '@/store/selectors/dataUpload';

interface IProgressList {
    progresses: Array<IProgress>;
}

const ProgressList: React.FC<IProgressList> = ({ progresses }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            {progresses.map(progress => (
                <ProgressBar {...progress} />
            ))}
        </div>
    );
};

export default ProgressList;
