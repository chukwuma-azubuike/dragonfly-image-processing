'use client';

import React, { useCallback } from 'react';
import { Accept, FileRejection, useDropzone } from 'react-dropzone';
import DropIcon from './dropicon';

interface IDropzoneProps {
    accept?: Accept;
    maxFiles?: number;
    disabled?: boolean;
    autoFocus?: boolean;
    handleFileDropAccepted: (arg: Array<File>) => void;
    handleFileDropRejected: (arg: Array<FileRejection>) => void;
}

const Dropzone: React.FC<IDropzoneProps> = props => {
    const { handleFileDropAccepted, handleFileDropRejected, maxFiles, disabled, autoFocus, accept } = props;

    const onDropAccepted = useCallback((acceptedFiles: Array<File>) => {
        try {
            handleFileDropAccepted(acceptedFiles);
        } catch (err) {
            // Handle error here
        }
    }, []);

    const onDropRejected = useCallback((fileRejections: Array<FileRejection>) => {
        try {
            handleFileDropRejected(fileRejections);
        } catch (err) {
            // Handle error here
        }
    }, []);

    const onError = (err: Error) => {
        // Handle error here
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDropAccepted,
        onDropRejected,
        maxFiles,
        onError,
        disabled,
        autoFocus,
        accept,
    });

    return (
        <div
            {...getRootProps()}
            className={`w-full p-8 border-4 border-dashed rounded-2xl cursor-pointer transition-transform duration-300 ease-in-out ${
                disabled ? 'opacity-70' : 'active:scale-105'
            } ${
                isDragActive && !disabled
                    ? 'border-slate-700 bg-zinc-400 transform scale-110'
                    : `border-gray-600 bg-gray-500 ${disabled ? '' : 'hover:border-grey-600 hover:bg-gray-400'}`
            }`}
        >
            <input {...getInputProps()} type="file" />
            <div className="flex flex-col items-center justify-center space-y-4">
                <DropIcon height={100} width={100} />
                <p className="text-gray-900 text-center">
                    {isDragActive ? 'Drop the files here...' : 'Drag & drop some files here, or click to select files'}
                </p>
            </div>
        </div>
    );
};

export default Dropzone;
