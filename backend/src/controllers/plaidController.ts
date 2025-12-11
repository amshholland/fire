import { Request, Response } from 'express';
import { PlaidService } from '../services/plaidService';

export class PlaidController {
    private plaidService: PlaidService;

    constructor() {
        this.plaidService = new PlaidService();
    }

    public async createLinkToken(req: Request, res: Response): Promise<void> {
        const { userId } = req.body;
        try {
            const linkToken = await this.plaidService.createLinkToken(userId);
            res.status(200).json({ link_token: linkToken });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).json({ error: message });
        }
    }

    public async getAccounts(req: Request, res: Response): Promise<void> {
        const { accessToken } = req.body;
        try {
            const accounts = await this.plaidService.getAccounts(accessToken);
            res.status(200).json(accounts);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).json({ error: message });
        }
    }
}