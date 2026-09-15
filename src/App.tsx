import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #333333',
            borderRadius: '14px',
            fontSize: '13px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          },
          success: {
            iconTheme: {
              primary: '#C6F135',
              secondary: '#111111',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#111111',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
