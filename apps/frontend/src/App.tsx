import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CreateLinkPage from './pages/CreateLinkPage';
import DashboardPage from './pages/DashboardPage';
import LinkDetailsPage from './pages/LinkDetailsPage';
import AnalyticsPage from './pages/AnalyticsPage';

import CollectionsPage from './pages/CollectionsPage';

import NotFoundPage from './pages/errors/NotFoundPage';
import InactivePage from './pages/errors/InactivePage';
import ExpiredPage from './pages/errors/ExpiredPage';
import ProtectedPage from './pages/errors/ProtectedPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="create" element={<CreateLinkPage />} />
            <Route path="links/:alias" element={<LinkDetailsPage />} />
            <Route path="links/:alias/analytics" element={<AnalyticsPage />} />
          </Route>
          
          <Route path="/error/not-found" element={<NotFoundPage />} />
          <Route path="/error/inactive" element={<InactivePage />} />
          <Route path="/error/expired" element={<ExpiredPage />} />
          <Route path="/error/500" element={<ServerErrorPage />} />
          <Route path="/protected/:alias" element={<ProtectedPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
