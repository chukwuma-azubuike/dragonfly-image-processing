'use client';

import { IProcessing } from '@/store/reducers';
import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';

const api_key = 'd8352701-03d5-4f15-a187-0c1de21ee37f'; // Set this as an environment variable
const proxy_url = 'https://thingproxy.freeboard.io/fetch/';
const base_url = `${proxy_url}https://dev.api.dragonflyai.co/pipeline`;

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
        return axios.put(`${proxy_url}${url}`, {
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
