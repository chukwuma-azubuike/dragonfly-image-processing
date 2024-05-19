import { IProcessing } from '@/store/reducers';
import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';

const base_url = process.env.NEXT_PUBLIC_BASE_URL;
const api_key = process.env.NEXT_PUBLIC_API_KEY;

class Api {
    generateURL = (config?: AxiosRequestConfig): AxiosPromise<{ url: string; key: string }> => {
        return axios.post(`${base_url}/assets/stage`, {
            headers: {
                Authorization: api_key,
            },
            ...config,
        });
    };

    uploadFile = (url: string, formData: BinaryData, config?: AxiosRequestConfig): AxiosPromise<unknown> => {
        return axios.put(url, {
            data: formData,
            headers: {
                'Content-Type': 'image/jpeg',
            },
            ...config,
        });
    };

    processFile = (key: string, config?: AxiosRequestConfig): AxiosPromise<unknown> => {
        const data = {
            key,
            pipeline: 'dragonfly-img-basic',
        };

        return axios.post(`${base_url}/assets/process`, {
            data,
            headers: {
                Authorization: api_key,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            ...config,
        });
    };

    checkProcessingFileStatus = (
        taskId: string,
        config?: AxiosRequestConfig
    ): AxiosPromise<Pick<IProcessing, 'status'>> => {
        const data = { taskId };

        return axios.post(`${base_url}/assets/status`, {
            data,
            headers: {
                Authorization: api_key,
                'Cache-Control': 'no-store',
                'Content-Type': 'application/json',
            },
            ...config,
        });
    };
}

const api: Api = new Api();

export default api;
