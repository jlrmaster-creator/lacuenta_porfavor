import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/presentation/layouts/AppLayout';
import { LoginScreen, RegisterScreen, ResetPasswordScreen } from '@/presentation/screens/auth/AuthScreens';
import { AccountDetailScreen } from '@/presentation/screens/accounts/AccountDetailScreen';
import { AccountSummaryScreen } from '@/presentation/screens/accounts/AccountSummaryScreen';
import { NewAccountScreen } from '@/presentation/screens/accounts/NewAccountScreen';
import { CatalogScreen } from '@/presentation/screens/catalog/CatalogScreen';
import { GroupDetailScreen } from '@/presentation/screens/groups/GroupDetailScreen';
import { GroupSummaryScreen } from '@/presentation/screens/groups/GroupSummaryScreen';
import { GroupsScreen } from '@/presentation/screens/groups/GroupsScreen';
import { NewGroupScreen } from '@/presentation/screens/groups/NewGroupScreen';
import { HistoryScreen } from '@/presentation/screens/history/HistoryScreen';
import { StatsScreen } from '@/presentation/screens/history/StatsScreen';
import { HomeScreen } from '@/presentation/screens/home/HomeScreen';
import { ProfileScreen } from '@/presentation/screens/profile/ProfileScreen';
import { Spinner } from '@/presentation/components/ui';
import { useAuth } from '@/state/hooks';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/reset" element={<ResetPasswordScreen />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/new-account" element={<NewAccountScreen />} />
            <Route path="/accounts/:id" element={<AccountDetailScreen />} />
            <Route path="/accounts/:id/summary" element={<AccountSummaryScreen />} />
            <Route path="/catalog" element={<CatalogScreen />} />
            <Route path="/groups" element={<GroupsScreen />} />
            <Route path="/groups/new" element={<NewGroupScreen />} />
            <Route path="/groups/:id" element={<GroupDetailScreen />} />
            <Route path="/groups/:id/summary" element={<GroupSummaryScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
