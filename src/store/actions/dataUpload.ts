import { createAction } from '@reduxjs/toolkit';
import { AxiosPromise } from 'axios';
import { v4 as uuid } from 'uuid';
import { IUploadStatus } from '../reducers/dataUpload';

export const dataUpload = createAction(
    'dataUpload/upload',
    <Fn extends (...args: any[]) => AxiosPromise>(
        {
            name,
            maxUploads,
            url,
            processingKey,
        }: { name: string; maxUploads: number; url: string; processingKey: string },
        apiMethod: Fn,
        ...args: Parameters<Fn>
    ) => {
        const id: string = uuid();
        const timestamp: number = new Date().getTime();
        const status: IUploadStatus = 'start';

        return {
            payload: {
                id,
                url,
                name,
                maxUploads,
                apiMethod,
                timestamp,
                status,
                args,
                processingKey,
            },
        };
    }
);

export const checkTaskStatus = createAction(
    'dataUpload/checkTaskStatus',
    ({ taskId, id }: { taskId: string; id: string }) => {
        return {
            payload: {
                id,
                taskId,
            },
        };
    }
);
