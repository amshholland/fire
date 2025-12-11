import express from 'express';
import { setItemsRoutes } from './routes/itemsRoutes';
import { setRoutes as setPlaidRoutes } from './routes/plaidRoutes';

const app = express();

app.use(express.json());
app.use(setItemsRoutes());
setPlaidRoutes(app);

export { app };