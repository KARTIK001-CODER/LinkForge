import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateLinkForm } from './features/links/components/CreateLinkForm';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">LinkForge</h1>
          <p className="text-gray-500 mt-2 font-medium">Intelligent Link Management</p>
        </div>
        
        <CreateLinkForm />
      </div>
    </QueryClientProvider>
  );
}

export default App;
