'use client';

import { combineReducers, configureStore, Middleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { createLogger } from 'redux-logger';
import { SagaMiddleware } from 'redux-saga';
import createSagaMiddleware from '@redux-saga/core';
import { all, fork } from 'redux-saga/effects';
import dataUploadRootSaga from './sagas/dataUpload';
import dataUploadReducer, { IDataUploadState } from './reducers/dataUpload';

export interface IState {
    dataUpload: IDataUploadState;
}

const rootReducer = combineReducers<IState>({
    dataUpload: dataUploadReducer as unknown as IState['dataUpload'],
});

export function* appSaga() {
    yield all([fork(dataUploadRootSaga)]);
}

const sagaMiddleware: SagaMiddleware = createSagaMiddleware({
    onError(error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(error);
        }
    },
});

const middlewares: Middleware[] = [sagaMiddleware];

if (process.env.NODE_ENV === 'development') {
    const logger: Middleware = createLogger({
        collapsed: true,
        duration: true,
    });
    middlewares.push(logger);
}

const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat([...middlewares]),
});

// Run the saga
sagaMiddleware.run(appSaga);

export type IStore = ReturnType<typeof store.getState>;

setupListeners(store.dispatch);

export type IAppDispatch = typeof store.dispatch;

export default store;

export type Selector<TResult = any, TParams = any> = (state: IStore, props?: TParams) => TResult;
