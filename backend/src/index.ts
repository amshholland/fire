import {app} from './app';
import { setItemsRoutes } from './routes/itemsRoutes';
import express from 'express';

const PORT = process.env.PORT || 3030;

app.use(express.json());
setItemsRoutes();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});