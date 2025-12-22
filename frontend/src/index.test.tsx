import React from 'react'
import ReactDOM from 'react-dom/client'

// Mock all dependencies before importing index
jest.mock('./App.tsx', () => ({
  __esModule: true,
  default: () => <div data-testid="app">Mocked App</div>
}))

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: any) => (
    <div data-testid="google-oauth-provider">{children}</div>
  )
}))

jest.mock('./context/plaidContext.tsx', () => ({
  QuickstartProvider: ({ children }: any) => (
    <div data-testid="quickstart-provider">{children}</div>
  )
}))

describe('index.tsx', () => {
  let rootElement: HTMLElement

  beforeEach(() => {
    // Setup DOM
    rootElement = document.createElement('div')
    rootElement.id = 'root'
    document.body.appendChild(rootElement)

    // Clear mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    if (rootElement && document.body.contains(rootElement)) {
      document.body.removeChild(rootElement)
    }
    jest.resetModules()
  })

  it('renders the App component into the root element wrapped with providers', () => {
    const createRootMock = jest.spyOn(ReactDOM, 'createRoot')

    // Import index.tsx which will execute the render
    require('./index')

    expect(createRootMock).toHaveBeenCalledWith(rootElement)
    expect(createRootMock).toHaveBeenCalledTimes(1)

    createRootMock.mockRestore()
  })

  it('throws an error if the root element does not exist', () => {
    // Remove the root element to simulate missing root
    document.body.removeChild(rootElement)

    // Reset modules to clear the cached require
    jest.resetModules()

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    expect(() => {
      require('./index')
    }).toThrow('Root element not found')

    consoleErrorSpy.mockRestore()
  })
})
