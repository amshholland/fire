import React from 'react';
import ReactDOM from 'react-dom/client';
import { jest } from '@jest/globals';

jest.mock('./App.tsx', () => () => <div>Mocked App</div>);

describe('index.tsx', () => {
  it('renders the App component into the root element', () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    const renderMock = jest.fn();
    const createRootMock = jest.spyOn(ReactDOM, 'createRoot').mockReturnValue({
      render: renderMock,
    } as unknown as ReactDOM.Root);

    jest.spyOn(document, 'getElementById').mockReturnValue(rootElement);

    require('./index');

    expect(createRootMock).toHaveBeenCalledWith(rootElement);
    expect(renderMock).toHaveBeenCalledWith(
      <React.StrictMode>
        <div>Mocked App</div>
      </React.StrictMode>
    );

    createRootMock.mockRestore();
    document.body.removeChild(rootElement);
  });

  it('throws an error if the root element is not found', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    expect(() => require('./index')).toThrow('Root element not found');
  });
});