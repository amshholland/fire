import { Router } from 'express';
import {PlaidController} from '../controllers/plaidController';

const router = Router();
const plaidController = new PlaidController();

export function setRoutes(app: Router) {
    app.post('/api/plaid/link_token', plaidController.createLinkToken.bind(plaidController));
    app.get('/api/plaid/accounts', plaidController.getAccounts.bind(plaidController));
    // Add more routes as needed
}

export default router;