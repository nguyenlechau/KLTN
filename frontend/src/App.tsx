import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginScreen } from './screens/LoginScreen';
import { UsersScreen } from './screens/UsersScreen';
import { AdvertisingContentListScreen } from './screens/master/AdvertisingContentListScreen';
import { CategoryManagementScreen } from './screens/master/CategoryManagementScreen';
import { LocationManagementScreen } from './screens/master/LocationManagementScreen';
import { PhysicalItemsScreen } from './screens/master/PhysicalItemsScreen';
import { ChannelsScreen } from './screens/master/ChannelsScreen';
import { RegistrationListScreen } from './screens/registrations/RegistrationListScreen';
import { RegistrationDetailScreen } from './screens/registrations/RegistrationDetailScreen';
import { DeploymentAcceptanceScreen } from './screens/registrations/DeploymentAcceptanceScreen';
import { AuthPage } from './screens/AuthPage';

export function App() {
  const token = localStorage.getItem('access_token');

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={!token ? <Navigate to="/login" replace /> : <Layout />}>
        <Route index element={<Navigate to="/registrations" replace />} />
        
        {/* Registration Management */}
        <Route path="registrations" element={<RegistrationListScreen />} />
        <Route path="registrations/:id" element={<RegistrationDetailScreen />} />
        <Route path="registrations/:id/deployment" element={<DeploymentAcceptanceScreen />} />
        
        {/* Master Data Management */}
        <Route path="master/content" element={<AdvertisingContentListScreen />} />
        <Route path="master/categories" element={<CategoryManagementScreen />} />
        <Route path="master/locations" element={<LocationManagementScreen />} />
        <Route path="master/items" element={<PhysicalItemsScreen />} />
        <Route path="master/channels" element={<ChannelsScreen />} />
        
        {/* User Management */}
        <Route path="admin/users" element={<UsersScreen />} />
      </Route>
    </Routes>
  );
}
