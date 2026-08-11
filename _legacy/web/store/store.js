
import rootReducers from './rootReducers'
import { configureStore } from '@reduxjs/toolkit'
const store = configureStore({
    reducer: rootReducers,
    devTools: true,
    middleware: getDefaultMiddleware => {
        return getDefaultMiddleware({
            serializableCheck: false
        })
    }
})

export default store;
