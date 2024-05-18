import { AxiosProgressEvent, AxiosPromise } from 'axios';
import { buffers, channel, Channel, END, eventChannel, EventChannel } from 'redux-saga';
import { all, call, fork, put, take } from 'typed-redux-saga';
import _ from 'lodash';

import { checkTaskStatus, dataUpload } from '../actions/dataUpload';
import { dataUploadActions } from '../reducers/dataUpload';
import api from '@/utils/api';

type AddToUploadQueueAction = ReturnType<typeof dataUploadActions.addToUploadQueue>;
type UpdateTaskProcessingProgress = ReturnType<typeof dataUploadActions.updateTaskProcessingProgress>;

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
        function onUploadProgress(progressEvent: AxiosProgressEvent): void {
            console.log({ progressEvent });
            // Emit progress to listener
            emitter(progressEvent);
        }

        // This function returns a function that invokes "apiMethod" with it's arguments spread over an array.
        const fn: (...args: any[]) => Promise<any> = _.spread(apiMethod);

        fn(
            /**
             * "apiMethod" called with it's Arguments spread over as an array
             */
            [
                url,
                ...args,
                {
                    onUploadProgress,
                },
            ]
        )
            .then(response => {
                // Emit success event to listener
                emitter({ type: 'successful', response });
            })
            .catch(() => {
                // Emit failure event to listener
                emitter({ type: 'failure', id });
            })
            .finally(() => {
                // Emit an abort signal to listener
                emitter(END);
            });

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
    } catch (err) {
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
    } catch (err) {
        // Handle error (Maybe send to remote error logger like Sentry)
    }
}

// Create channel queue with expanding buffer to handle an unknown number of queue count
const createUploadQueue = () => channel<AddToUploadQueueAction>(buffers.expanding());

// Handle upload queues
function* uploadQueueHandler(): Generator {
    const queue = yield* call(createUploadQueue);

    const maxConcurrentUploads = 10; // To be passed as part of the action payload.

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
    } catch (err) {
        // Handle error
    } finally {
    }
}

function* handleStatusCheck(action: UpdateTaskProcessingProgress): Generator {
    const { id, taskId } = action.payload;

    // Exit if invalid
    if (!id || !taskId) {
        return;
    }

    try {
        // Call status check api with argument: taskId
        const processingStatus = yield* call(api.checkProcessingFileStatus, taskId);

        // Update the status of the processing task
        yield* put(dataUploadActions.updateTaskProcessingProgress({ processing: processingStatus as any, taskId, id }));
    } catch (error: any) {
        // Mark upload a failed in store
        yield* put(dataUploadActions.markProcessingFailed({ id, error }));
    }
}

function* statusCheckWorker(queue: Channel<UpdateTaskProcessingProgress>): Generator {
    try {
        while (true) {
            // Listen for individual action from queue
            const checkStatusAction = yield* take(queue);

            // Blocking call to process each action with FIFO strategy
            yield* call(handleStatusCheck, checkStatusAction);
        }
    } catch (err) {
        // Handle error (Maybe send to remote error logger like Sentry)
    }
}

// Create channel queue with expanding buffer to handle an unknown number of queue count
const createTaskCheckQueue = () => channel<UpdateTaskProcessingProgress>(buffers.expanding());

// Handle task status check
function* taskStatusCheckHandler(): Generator {
    const queue = yield* call(createTaskCheckQueue);

    const maxConcurrentTaskChecks = 10;

    // Spawn status check worker for each action queue
    for (let i = 0; i <= maxConcurrentTaskChecks; i++) {
        yield* fork(statusCheckWorker, queue);
    }

    try {
        while (true) {
            // Listen for dispatched checkTaskStatus actions
            const { payload } = yield* take<ReturnType<typeof checkTaskStatus>>(checkTaskStatus.type);
        }
    } catch (err) {
        // Handle error
    } finally {
    }
}

// Root Saga
export default function* dataUploadRootSaga(): Generator {
    yield* all([fork(uploadQueueHandler), fork(taskStatusCheckHandler)]);
}
