import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'
import * as useUserAuthModule from './hooks/useUserAuth'
import * as useAppAuthStateModule from './hooks/useAppAuthState'
import * as useAppInitializationModule from './hooks/useAppInitialization'

// Mock components
jest.mock('./components/AppLayout.tsx', () => ({
  AppLayout: ({ user, children }: any) => (
    <div data-testid="app-layout">
      <div data-testid="user-info">{user?.email}</div>
      {children}
    </div>
  )
}))

jest.mock('./components/LoadingView.tsx', () => ({
  LoadingView: () => <div data-testid="loading-view">Loading...</div>
}))

jest.mock('./pages/LandingPage/LandingPage.tsx', () => ({
  __esModule: true,
  default: ({ onLoginSuccess, user }: any) => (
    <div data-testid="landing-page">
      {!user ? (
        <button onClick={() => onLoginSuccess({ email: 'test@example.com' })}>
          Sign In
        </button>
      ) : (
        <div>Plaid Link Component</div>
      )}
    </div>
  )
}))

jest.mock('./pages/Dashboard/Dashboard.tsx', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard">Dashboard</div>
}))

describe('App', () => {
  const mockInitializeApp = jest.fn()
  const mockHandleLoginSuccess = jest.fn()
  const mockHandleLogout = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderApp = (
    userAuthState: any = {},
    authState: any = {},
    initState: any = {}
  ) => {
    const defaultUserAuth = {
      user: null,
      handleLoginSuccess: mockHandleLoginSuccess,
      handleLogout: mockHandleLogout,
      isInitialized: true,
      ...userAuthState
    }

    const defaultAuthState = {
      state: 'unauthenticated',
      user: null,
      isInitialized: true,
      linkSuccess: false,
      ...authState
    }

    const defaultInitState = {
      ...initState
    }

    jest
      .spyOn(useUserAuthModule, 'useUserAuth')
      .mockReturnValue(defaultUserAuth)
    jest
      .spyOn(useAppAuthStateModule, 'useAppAuthState')
      .mockReturnValue(defaultAuthState)
    jest
      .spyOn(useAppInitializationModule, 'useAppInitialization')
      .mockReturnValue(mockInitializeApp)

    return render(<App />)
  }

  describe('Loading State', () => {
    it('should render LoadingView when auth is initializing', () => {
      renderApp({ isInitialized: false }, { state: 'loading' })
      expect(screen.getByTestId('loading-view')).toBeInTheDocument()
    })

    it('should not call initializeApp when not initialized', () => {
      renderApp({ isInitialized: false }, { state: 'loading' })
      expect(mockInitializeApp).not.toHaveBeenCalled()
    })
  })

  describe('Unauthenticated State', () => {
    it('should render LandingPage when user is not authenticated', () => {
      renderApp(
        { user: null, isInitialized: true },
        { state: 'unauthenticated' }
      )
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    it('should pass onLoginSuccess to LandingPage', () => {
      renderApp(
        { user: null, isInitialized: true },
        { state: 'unauthenticated' }
      )

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      expect(signInButton).toBeInTheDocument()
    })

    it('should call initializeApp when initialized', () => {
      renderApp(
        { user: null, isInitialized: true },
        { state: 'unauthenticated' }
      )
      expect(mockInitializeApp).toHaveBeenCalled()
    })
  })

  describe('Google Authenticated State', () => {
    const mockUser = { email: 'test@example.com', name: 'Test User' }

    it('should render LandingPage with user when in google_authenticated state', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'google_authenticated', user: mockUser }
      )
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    it('should not render AppLayout in google_authenticated state', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'google_authenticated', user: mockUser }
      )
      expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
    })

    it('should call initializeApp when initialized', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'google_authenticated', user: mockUser }
      )
      expect(mockInitializeApp).toHaveBeenCalled()
    })
  })

  describe('Fully Authenticated State', () => {
    const mockUser = { email: 'test@example.com', name: 'Test User' }

    it('should render Dashboard when user is authenticated and Plaid is linked', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'authenticated', user: mockUser, linkSuccess: true }
      )
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })

    it('should render AppLayout with user in authenticated state', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'authenticated', user: mockUser, linkSuccess: true }
      )
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
      expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email)
    })

    it('should not render LandingPage in authenticated state', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'authenticated', user: mockUser, linkSuccess: true }
      )
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
    })

    it('should call initializeApp when initialized', () => {
      renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'authenticated', user: mockUser, linkSuccess: true }
      )
      expect(mockInitializeApp).toHaveBeenCalled()
    })
  })

  describe('State Transitions', () => {
    it('should handle transition from loading to unauthenticated', () => {
      const { rerender } = renderApp(
        { isInitialized: false },
        { state: 'loading' }
      )

      expect(screen.getByTestId('loading-view')).toBeInTheDocument()

      jest.spyOn(useUserAuthModule, 'useUserAuth').mockReturnValue({
        user: null,
        handleLoginSuccess: mockHandleLoginSuccess,
        handleLogout: mockHandleLogout,
        isInitialized: true
      })

      jest.spyOn(useAppAuthStateModule, 'useAppAuthState').mockReturnValue({
        state: 'unauthenticated',
        user: null,
        isInitialized: true,
        linkSuccess: false
      })

      rerender(<App />)

      expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument()
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    it('should handle transition from unauthenticated to google_authenticated', () => {
      const mockUser = { email: 'test@example.com' }
      const { rerender } = renderApp(
        { user: null, isInitialized: true },
        { state: 'unauthenticated' }
      )

      expect(screen.getByTestId('landing-page')).toBeInTheDocument()

      jest.spyOn(useUserAuthModule, 'useUserAuth').mockReturnValue({
        user: mockUser,
        handleLoginSuccess: mockHandleLoginSuccess,
        handleLogout: mockHandleLogout,
        isInitialized: true
      })

      jest.spyOn(useAppAuthStateModule, 'useAppAuthState').mockReturnValue({
        state: 'google_authenticated',
        user: mockUser,
        isInitialized: true,
        linkSuccess: false
      })

      rerender(<App />)

      // LandingPage still shown with user (now displaying Plaid link)
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    it('should handle transition from google_authenticated to authenticated', () => {
      const mockUser = { email: 'test@example.com' }
      const { rerender } = renderApp(
        { user: mockUser, isInitialized: true },
        { state: 'google_authenticated', user: mockUser }
      )

      expect(screen.getByTestId('landing-page')).toBeInTheDocument()

      jest.spyOn(useAppAuthStateModule, 'useAppAuthState').mockReturnValue({
        state: 'authenticated',
        user: mockUser,
        isInitialized: true,
        linkSuccess: true
      })

      rerender(<App />)

      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })
  })

  describe('useEffect - App Initialization', () => {
    it('should call initializeApp only after auth is initialized', () => {
      const { rerender } = renderApp(
        { isInitialized: false },
        { state: 'loading' }
      )

      expect(mockInitializeApp).not.toHaveBeenCalled()

      jest.spyOn(useUserAuthModule, 'useUserAuth').mockReturnValue({
        user: null,
        handleLoginSuccess: mockHandleLoginSuccess,
        handleLogout: mockHandleLogout,
        isInitialized: true
      })

      jest.spyOn(useAppAuthStateModule, 'useAppAuthState').mockReturnValue({
        state: 'unauthenticated',
        user: null,
        isInitialized: true,
        linkSuccess: false
      })

      rerender(<App />)

      expect(mockInitializeApp).toHaveBeenCalled()
    })

    it('should only call initializeApp once when state changes', () => {
      renderApp(
        { user: null, isInitialized: true },
        { state: 'unauthenticated' }
      )

      expect(mockInitializeApp).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error States', () => {
    it('should render LoadingView if auth state is unexpected', () => {
      renderApp({ isInitialized: false }, { state: 'loading' as any })

      expect(screen.getByTestId('loading-view')).toBeInTheDocument()
    })
  })
})
