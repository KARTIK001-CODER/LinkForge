import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/api/auth';
import { AuthGuard, GuestGuard } from './features/auth/components/AuthGuard';
import Layout from './components/Layout';
import CreateLinkPage from './pages/CreateLinkPage';
import DashboardPage from './pages/DashboardPage';
import LinkDetailsPage from './pages/LinkDetailsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CollectionsPage from './pages/CollectionsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import InactivePage from './pages/errors/InactivePage';
import ExpiredPage from './pages/errors/ExpiredPage';
import ProtectedPage from './pages/errors/ProtectedPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
            <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
              <Route index element={<DashboardPage />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="create" element={<CreateLinkPage />} />
              <Route path="links/:alias" element={<LinkDetailsPage />} />
              <Route path="links/:alias/analytics" element={<AnalyticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="security" element={<SecurityPage />} />
            </Route>

            <Route path="/error/not-found" element={<NotFoundPage />} />
            <Route path="/error/inactive" element={<InactivePage />} />
            <Route path="/error/expired" element={<ExpiredPage />} />
            <Route path="/error/500" element={<ServerErrorPage />} />
            <Route path="/protected/:alias" element={<ProtectedPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
