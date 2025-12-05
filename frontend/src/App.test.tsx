import { render, screen } from "@testing-library/react";
import App from "./App.tsx";

describe("App Component", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("renders App with GoogleOAuthProvider when clientId is provided", () => {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = "test-client-id";

    render(<App />);

    expect(screen.getByText(/Welcome to the Home Screen/i)).toBeInTheDocument();
  });

  it("does not render App and logs error when clientId is missing", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    delete process.env.REACT_APP_GOOGLE_CLIENT_ID;

    render(<App />);

    expect(screen.queryByText(/Welcome to the Home Screen/i)).not.toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Google Client ID is missing. Check your .env file."
    );

    consoleErrorSpy.mockRestore();
  });
});