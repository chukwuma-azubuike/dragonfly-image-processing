import { AxiosProgressEvent, AxiosPromise } from 'axios';
import { buffers, channel, Channel, END, eventChannel, EventChannel } from 'redux-saga';
import { all, call, fork, put, take } from 'typed-redux-saga';
import spread from 'lodash/spread';

import { checkTaskStatus, dataUpload } from './actions';
import { IProcessing, dataUploadActions } from './reducers';
import api from '@/utils/api';
import { toast } from 'react-toastify';

type AddToUploadQueueAction = ReturnType<typeof dataUploadActions.addToUploadQueue>;

// Api call to start file processing
const processFile = async (processingKey: string): Promise<{ taskId: string }> => {
    return (await api.processFile(processingKey)).data as { taskId: string };
};

function* createUploader(
    id: string,
    url: string,
    apiMethod: (...args: any[]) => AxiosPromise,
    args: any[],
    processingKey: string
): Generator {
    // Initialise an event channel for each file upload
    const chan: EventChannel<any> = eventChannel((emitter: (input: any | END) => void) => {
        // Capture upload progress. The "onUploadProgress" function is accepted as an optional config parameter in axios
        // function onUploadProgress(progressEvent: AxiosProgressEvent): void {
        //     // Emit progress to listener
        //     emitter(progressEvent);
        // }

        // Mock upload progress behaviour

        let loaded = 0;
        const total = 500000;

        setInterval(() => {
            if (total <= loaded) {
                emitter({ type: 'finished' });
                emitter(END);
            }

            if (loaded < total) {
                loaded = loaded + Math.round(Math.random()) * 10000;
                emitter({ loaded, total });
            }
        }, 1000);

        // This function returns a function that invokes "apiMethod" with it's arguments spread over an array.
        // const invokeApiMethod: (...args: any[]) => Promise<any> = spread(apiMethod);

        // invokeApiMethod(
        //     /**
        //      * "apiMethod" called with it's Arguments spread over as an array
        //      */
        //     [
        //         url,
        //         ...args,
        //         {
        //             onUploadProgress,
        //         },
        //     ]
        // )
        //     .then(response => {
        //         // Emit success event to listener
        //         emitter({ type: 'finished', response });
        //     })
        //     .catch((error: Error) => {
        //         // Emit failure event to listener
        //         emitter({ type: 'failure', id });
        //         toast.error(error.message);
        //     })
        //     .finally(() => {
        //         // Emit an abort signal to listener
        //         emitter(END);
        //     });

        return () => {
            return;
        };
    });

    try {
        while (true) {
            // Listen for changes on event channel
            const event = yield* take(chan);

            // Update upload progress in store
            if (event.loaded || event.total) {
                yield* put(
                    dataUploadActions.updateUploadProgress({
                        id,
                        loaded: event.loaded,
                        total: event.total,
                    })
                );
            }

            if (event.type === 'finished') {
                // Mark as finished
                yield* put(dataUploadActions.markUploadFinished({ id }));

                // Start processing the file
                try {
                    // Fetch the taskId
                    const { taskId } = yield* call(processFile, processingKey);

                    // Mark processing status as started & store the taskId for future reference
                    yield* put(dataUploadActions.startProcessing({ id, taskId }));
                } catch (error) {
                    // Handle Error
                    yield* put(dataUploadActions.markProcessingFailed({ id }));
                }
            }

            if (event.type === 'failure') {
                // Mark as failure
                yield* put(dataUploadActions.markUploadFailed({ id }));
            }
        }
    } catch (error) {
        // Handle error (Maybe send to remote error logger like Sentry)
    }
}

function* handleUpload(action: AddToUploadQueueAction): Generator {
    const { id, apiMethod, args, url, processingKey } = action.payload;

    // Exit if invalid
    if (!id || !apiMethod || !args || !url || !processingKey) {
        return;
    }

    try {
        // Mark upload a fetching in store
        yield* put(dataUploadActions.markUploadFetching({ id }));

        // Call createUploader function with arguments: id, url, apiMethod, args, processingKey
        yield* call(createUploader, id, url, apiMethod, args, processingKey);
    } catch (error: any) {
        toast.error(error.message);
        // Mark upload a failed in store
        yield* put(dataUploadActions.markUploadFailed({ id, error }));
    }
}

function* uploadWorker(queue: Channel<AddToUploadQueueAction>): Generator {
    try {
        while (true) {
            // Listen for individual action from queue
            const uploadAction = yield* take(queue);

            // Blocking call to process each action with FIFO strategy
            yield* call(handleUpload, uploadAction);
        }
    } catch (error) {
        // Handle error (Maybe send to remote error logger like Sentry)
    }
}

// Create channel queue with expanding buffer
const createUploadQueue = () => channel<AddToUploadQueueAction>(buffers.expanding());

// Handle upload queues
function* uploadQueueHandler(): Generator {
    const queue = yield* call(createUploadQueue);

    // Set maximum concurrent uploads to limit burden on server & client
    const maxConcurrentUploads = 10;

    // Spawn upload worker for each upload queue
    for (let i = 0; i <= maxConcurrentUploads; i++) {
        yield* fork(uploadWorker, queue);
    }

    try {
        while (true) {
            // Listen for dispatched dataUpload actions
            const { payload } = yield* take<ReturnType<typeof dataUpload>>(dataUpload.type);

            // Update store to represent each file queued for upload
            const newAction = dataUploadActions.addToUploadQueue(payload);

            yield* put(newAction);
            yield* put(queue, newAction);
        }
    } catch (error) {
        // Handle error
    } finally {
    }
}

// Handle task status check
function* taskStatusCheckHandler(): Generator {
    while (true) {
        // Listen for dispatched checkTaskStatus actions
        const {
            payload: { id, taskId },
        } = yield* take<ReturnType<typeof checkTaskStatus>>(checkTaskStatus.type);

        if (id && taskId) {
            try {
                // Call status check api with argument: taskId
                const processingStatus = (yield* call(api.checkProcessingFileStatus, taskId)) as unknown as Pick<
                    IProcessing,
                    'status'
                >;

                // Update the status of the processing task
                yield* put(
                    dataUploadActions.updateTaskProcessingProgress({
                        processing: processingStatus,
                        taskId,
                        id,
                    })
                );
            } catch (error: any) {
                // Mark upload a failed in store
                toast.error(error?.message || 'Unable to check task status');
            }
        }
    }
}

// Root Saga
export default function* dataUploadRootSaga(): Generator {
    yield* all([fork(uploadQueueHandler), fork(taskStatusCheckHandler)]);
}
