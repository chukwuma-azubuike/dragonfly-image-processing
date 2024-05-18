'use client';

import { combineReducers, configureStore, Middleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { SagaMiddleware } from 'redux-saga';
import createSagaMiddleware from '@redux-saga/core';
import { all, fork } from 'redux-saga/effects';
import { createLogger } from 'redux-logger';
import dataUploadReducer, { IDataUploadState } from './reducers';
import dataUploadRootSaga from './sagas';

export interface IState {
    dataUpload: IDataUploadState;
}

// Root reducer for store slice(s)
const rootReducer = combineReducers<IState>({
    dataUpload: dataUploadReducer as unknown as IState['dataUpload'],
});

// Compose Sagas
export function* appSaga() {
    yield all([fork(dataUploadRootSaga)]);
}

// Initialise Saga middleware
const sagaMiddleware: SagaMiddleware = createSagaMiddleware({
    onError(error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(error);
        }
    },
});

// Add Saga middleware
const middlewares: Middleware[] = [sagaMiddleware];

// Add logging middleware for dispatched actions to help debugging
if (process.env.NODE_ENV === 'development') {
    const logger: Middleware = createLogger({
        collapsed: true,
        duration: true,
    });
    middlewares.push(logger);
}

// Initialise redux store with configurations
const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat([...middlewares]),
});

// Run the saga
sagaMiddleware.run(appSaga);

// Configure dispatch listeners with the recommended defaults
setupListeners(store.dispatch);

export type IStore = ReturnType<typeof store.getState>;
export type IAppDispatch = typeof store.dispatch;
export type Selector<TResult = any, TParams = any> = (state: IStore, props?: TParams) => TResult;

export default store;
