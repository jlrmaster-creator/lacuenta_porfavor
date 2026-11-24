import { AppRouter } from '@/app/router';
import { isFirebaseConfigured } from '@/config/firebase';
import { SetupScreen } from '@/presentation/screens/SetupScreen';
import { useAuthBootstrap } from '@/state/hooks';

export default function App() {
  useAuthBootstrap();
  return isFirebaseConfigured ? <AppRouter /> : <SetupScreen />;
}
