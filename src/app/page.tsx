'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileRejection } from 'react-dropzone';

import api from '@/utils/api';
import { checkTaskStatus, dataUpload } from '@/store/actions/dataUpload';
import { selectAllUploadProgresses } from '@/store/selectors/dataUpload';

import Dropzone from '@/components/dropzone';
import ProgressList from '@/components/progressList';

const maxUploads: number = 10;
const taskCheckInterval: number = 2000;

const App: React.FC = () => {
    // Initialise function for dispatching actions
    const dispatch = useDispatch();

    // Fetch progress status for each upload instance from store
    const progresses = useSelector(selectAllUploadProgresses);

    // Uploads that have started image processing stage
    const processingStarted = useMemo(
        () => progresses.filter(progress => progress.status === 'processing_started'),
        [progresses]
    );

    // Initialise local state management to handle dropped files
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);

    // Simulated progresses
    const [simulatedProgresses, setSimulatedProgresses] = useState<any[]>([] as any);

    // Simulate trigger
    const [startUploadTrigger, setStartUploadTrigger] = useState<boolean>(false);

    // Handle check task status
    useEffect(() => {
        if (!processingStarted?.length) {
            setInterval(() => {
                processingStarted.map(process => {
                    const { id, taskId } = process;

                    // Dispatch check task status action
                    if (id && taskId) {
                        dispatch(checkTaskStatus({ taskId, id }));
                    }
                });
            }, taskCheckInterval);
        }
    }, [processingStarted]);

    // Simulate Upload progress
    useEffect(() => {
        const unsubscribe = setInterval(() => {
            if (startUploadTrigger) {
                setSimulatedProgresses(prev => {
                    return [
                        ...prev.map(file => {
                            return {
                                ...file,
                                status: file.uploadingPercentage >= 100 ? 'finished' : 'uploading',
                                uploadingPercentage: file.uploadingPercentage + Math.floor(Math.random() * 3),
                            };
                        }),
                    ];
                });
            }
        }, 1000);

        if (!startUploadTrigger) {
            clearInterval(unsubscribe);
        }

        return () => {
            clearInterval(unsubscribe);
        };
    }, [startUploadTrigger]);

    useEffect(() => {
        if (queuedFiles.length) {
            setSimulatedProgresses(() => {
                return [
                    ...queuedFiles.map(file => {
                        return {
                            label: `${file.name.substring(0, 10)}.jpeg`,
                            uploadingPercentage: 0,
                            status: 'dropped',
                        };
                    }),
                ];
            });
        }
    }, [queuedFiles.length]);

    // Handle upload process
    const startUpload = useCallback(() => {
        // Trigger simulation
        setStartUploadTrigger(true);

        // Iterate over queued files to dispatch an upload action for each
        queuedFiles.forEach(async file => {
            // Convert file to binary data
            const arrayBuffer = await file.arrayBuffer();
            const binaryData = new Uint8Array(arrayBuffer);

            try {
                // Fetch key and url for file staging process
                const { url, key } = (await api.generateURL()).data;

                // Dispatch upload action for file & pass arguments for the processing step
                dispatch(
                    dataUpload({ name: file.name, maxUploads, url, processingKey: key }, api.uploadFile, binaryData)
                );
            } catch (err) {
                // Log error to remote service (e.g Sentry) or display in ui
            }
        });
    }, [queuedFiles, maxUploads]);

    const handleFileDropAccepted = useCallback((files: Array<File>) => {
        // Update list of files with new files dropped
        setQueuedFiles(prevFiles => [...prevFiles, ...files]);
    }, []);

    const handleFileDropRejected = (files: Array<FileRejection>) => {
        // Handle file rejection
    };

    return (
        <main className="flex min-h-screen flex-col items-center space-y-16 py-24 px-8 max-w-[700px] m-auto select-none">
            <Dropzone
                disabled={startUploadTrigger}
                handleFileDropRejected={handleFileDropRejected}
                handleFileDropAccepted={handleFileDropAccepted}
            />
            <button
                disabled={startUploadTrigger || !queuedFiles.length}
                className={`relative inline-flex items-center justify-center p-4 px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden font-medium transition duration-300 ease-out border-2 border-green-600 ${
                    startUploadTrigger ? '' : 'hover:text-green-600 hover:border-white active:scale-105'
                } rounded-full shadow-md group`}
                onClick={startUpload}
            >
                <span
                    className={`flex items-center justify-center w-full h-full transition-all transform ${
                        startUploadTrigger ? '' : 'group-hover:translate-y-px'
                    } ease`}
                >
                    Start upload
                </span>
            </button>
            <ProgressList progresses={progresses.length ? progresses : simulatedProgresses} />
        </main>
    );
};

export default App;
