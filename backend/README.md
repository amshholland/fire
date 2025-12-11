# Plaid Integration Project

This project integrates the Plaid API into a Node.js and TypeScript Express application. It provides functionality for linking bank accounts, retrieving account information, and fetching transactions using the Plaid API.

## Project Structure

The project is organized as follows:

```
plaid-integration
├── src
│   ├── app.ts                # Entry point of the application
│   ├── index.ts              # Starts the server and listens on the specified port
│   ├── config
│   │   └── plaid.ts          # Configuration settings for the Plaid API
│   ├── controllers
│   │   └── plaidController.ts # Handles API requests related to Plaid
│   ├── routes
│   │   └── plaidRoutes.ts     # Sets up routes for the Plaid API endpoints
│   ├── services
│   │   └── plaidService.ts     # Interacts with the Plaid API
│   └── types
│       └── index.ts           # Defines types used throughout the application
├── __tests__
│   └── plaid.test.ts          # Tests for the Plaid API integration
├── .env.example                # Example environment variables for the project
├── package.json                # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                  # Documentation for the project
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd plaid-integration
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Create a `.env` file:**
   Copy the `.env.example` file to `.env` and fill in your Plaid API credentials.

4. **Run the application:**
   ```
   npm start
   ```

5. **Access the API:**
   The API will be available at `http://localhost:3030/api/plaid`.

## Usage Examples

- **Create a Link Token:**
  Send a POST request to `/api/plaid/link_token` to create a link token for the Plaid Link flow.

- **Retrieve Account Information:**
  Send a GET request to `/api/plaid/accounts` to retrieve account information linked through Plaid.

- **Fetch Transactions:**
  Send a GET request to `/api/plaid/transactions` to fetch transactions for a linked account.

## Testing

To run the tests for the Plaid API integration, use the following command:

```
npm test
```

This will execute the tests defined in `__tests__/plaid.test.ts`.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.