import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '@/features/landing/LandingPage';
import LoginPage from '@/features/auth/LoginPage';
import AdminLayout from '@/features/admin/AdminLayout';
import AdminOverview from '@/features/admin/pages/AdminOverview';
import RolesPage from '@/features/admin/pages/RolesPage';
import FeaturesPage from '@/features/admin/pages/FeaturesPage';
import SettingsPage from '@/features/admin/pages/SettingsPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="roles" element={<RolesPage />} />
                    <Route path="features" element={<FeaturesPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}
