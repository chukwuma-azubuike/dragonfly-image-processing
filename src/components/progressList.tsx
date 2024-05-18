'use client';

import React from 'react';
import ProgressBar from './progressBar';
import { IProgress } from '@/store/selectors';

interface IProgressList {
    progresses?: Array<IProgress>;
    files?: Array<File>;
}

const ProgressList: React.FC<IProgressList> = ({ progresses, files }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            {progresses?.length
                ? progresses?.map((progress, index) => <ProgressBar key={index} {...progress} />)
                : files?.map((file, index) => <ProgressBar key={index} file={file} />)}
        </div>
    );
};

export default ProgressList;
