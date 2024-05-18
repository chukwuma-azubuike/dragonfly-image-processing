import { createSelector } from 'reselect';
import { IState, Selector } from '..';
import { IDataUploadState, IProcessing, IUpload, IUploadStatus } from '../reducers/dataUpload';

export interface IProgress {
    id: string;
    label: string;
    taskId?: string;
    uploadingPercentage?: number;
    processingPercentage?: number;
    processing?: IProcessing;
    status: IUploadStatus;
    cancel?: () => void;
}

// Select dataUpload node from store
export const selectDatauploadNode: Selector<IDataUploadState> = (state: IState) => state.dataUpload;

// Select uploads field from dataUpload node
export const selectAllUploads: Selector<Record<string, IUpload>> = (state: IState) =>
    selectDatauploadNode(state).uploads;

// Return value of each upload object into array
export const selectAllUploadsArray: Selector<IUpload[]> = createSelector(
    [selectAllUploads],
    (allUploads: Record<string, IUpload>) => {
        return Object.values(allUploads);
    }
);

// Transform uploads array to return derived progress for each upload
export const selectAllUploadProgresses: Selector<Array<IProgress>> = createSelector(
    [selectAllUploadsArray],
    (allUploadsArray: IUpload[]): IProgress[] => {
        return allUploadsArray.map((upload: IUpload) => {
            const { progress, processing } = upload;

            let uploadingPercentage: number | undefined;
            let processingPercentage: number | undefined;

            if (progress) {
                uploadingPercentage = Math.round((progress.loaded / progress.total) * 100);
            }

            if (processing) {
                // TODO: To be determined
                // processingPercentage = processing.percentage;
            }

            return {
                id: upload.id,
                label: upload.name,
                uploadingPercentage,
                processingPercentage,
                taskId: upload.taskId,
                status: upload.status,
                cancel: upload.cancel,
                processing: upload.processing,
            };
        });
    }
);
