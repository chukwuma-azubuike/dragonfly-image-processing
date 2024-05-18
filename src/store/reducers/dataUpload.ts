'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosPromise } from 'axios';

export type IUploadStatus =
    | 'start'
    | 'finished'
    | 'queued'
    | 'failed'
    | 'uploading'
    | 'fetching'
    | 'processing_started'
    | 'processing'
    | 'processing_failed'
    | 'processing_finished';

export interface IProcessing {
    error?: Error;
    status?: string;
}

export interface IUpload {
    id: string;
    name: string;
    url: string;
    taskId?: string;
    processingKey: string;
    apiMethod: (...args: any[]) => AxiosPromise;
    args?: any[];
    progress?: {
        loaded: number;
        total: number;
    };
    processing?: IProcessing;
    error?: Error;
    status: IUploadStatus;
    timestamp?: number;
    cancel?: () => void;
}

export type IUploads = Record<string, IUpload>;

export interface IDataUploadState {
    uploads: {
        [key: string]: IUpload;
    };
}

const initialState: IDataUploadState = {
    uploads: {},
};

const dataUploadSlice = createSlice({
    name: 'dataUpload',
    initialState,
    reducers: {
        addToUploadQueue(state, { payload }: PayloadAction<Omit<IUpload, 'error' | 'progress'>>) {
            state.uploads[payload.id] = {
                ...payload,
                error: undefined,
                progress: undefined,
                status: 'queued',
            };
        },

        updateUploadProgress(state, { payload }: PayloadAction<{ id: string; loaded: number; total: number }>) {
            if (state.uploads[payload.id]) {
                state.uploads[payload.id].status = 'uploading';
                state.uploads[payload.id].progress = {
                    loaded: payload.loaded,
                    total: payload.total,
                };
            }
        },

        markUploadFetching(state, { payload }: PayloadAction<Pick<IUpload, 'id'>>) {
            if (state.uploads[payload.id]) {
                state.uploads[payload.id].status = 'fetching';
            }
        },

        markUploadFinished(state, { payload }: PayloadAction<Pick<IUpload, 'id'>>) {
            state.uploads[payload.id].status = 'finished';
        },

        markUploadFailed(state, { payload }: PayloadAction<Pick<IUpload, 'id' | 'error'>>) {
            if (state.uploads[payload.id]) {
                state.uploads[payload.id].status = 'failed';
                state.uploads[payload.id].error = payload.error;
            }
        },

        startProcessing(state, { payload }: PayloadAction<Pick<IUpload, 'id' | 'taskId'>>) {
            if (state.uploads[payload.id]) {
                state.uploads[payload.id].taskId = payload.taskId;
                state.uploads[payload.id].status = 'processing_started';
                state.uploads[payload.id].processing = {
                    error: undefined,
                    status: 'processing_started',
                };
            }
        },

        markProcessingFailed(state, { payload }: PayloadAction<Pick<IUpload, 'id' | 'error'>>) {
            state.uploads[payload.id].status = 'processing_failed';
        },

        updateTaskProcessingProgress(state, { payload }: PayloadAction<Pick<IUpload, 'id' | 'processing' | 'taskId'>>) {
            if (state.uploads[payload.id]) {
                state.uploads[payload.id].status = 'processing';
                state.uploads[payload.id].processing = {
                    status: payload.processing?.status,
                    error: payload.processing?.error,
                };
            }
        },

        markProcessingFinished(state, { payload }: PayloadAction<Pick<IUpload, 'id'>>) {
            state.uploads[payload.id].status = 'processing_finished';
        },

        clearFinishedUploads(state) {
            Object.keys(state.uploads).forEach(id => {
                if (state.uploads[id].status === 'finished') {
                    delete state.uploads[id];
                }
            });
        },
    },
});

const { actions, reducer } = dataUploadSlice;

export const dataUploadActions = actions;

export default reducer;
