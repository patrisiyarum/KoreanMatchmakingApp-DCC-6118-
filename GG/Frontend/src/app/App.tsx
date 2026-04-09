import { RouterProvider } from 'react-router';
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
          </AIAssistantProvider>
        </TranslatorProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}