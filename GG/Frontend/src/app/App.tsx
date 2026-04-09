import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { TranslatorProvider } from './context/TranslatorContext';
import { AIAssistantProvider } from './context/AIAssistantContext';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <TranslatorProvider>
          <AIAssistantProvider>
            <RouterProvider router={router} />
            <Toaster richColors position="top-center" />
          </AIAssistantProvider>
        </TranslatorProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}