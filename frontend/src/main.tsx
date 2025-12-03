import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './ui/AppLayout';
import Home from './pages/Home';
import QuestionFlow from './pages/QuestionFlow';
import Generation from './pages/Generation';
import Deployed from './pages/Deployed';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Templates from './pages/Templates';
import './tailwind.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'templates', element: <Templates /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'build/:templateId', element: <QuestionFlow /> },
      { path: 'generate', element: <Generation /> },
      { path: 'deployed', element: <Deployed /> }
    ]
  }
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);