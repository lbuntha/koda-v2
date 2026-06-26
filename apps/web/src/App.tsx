import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '@/features/landing/LandingPage';
import LoginPage from '@/features/auth/LoginPage';
import SignupPage from '@/features/auth/SignupPage';
import AdminLayout from '@/features/admin/AdminLayout';
import AdminOverview from '@/features/admin/pages/AdminOverview';
import RolesPage from '@/features/admin/pages/RolesPage';
import FeaturesPage from '@/features/admin/pages/FeaturesPage';
import SettingsPage from '@/features/admin/pages/SettingsPage';
import AdminPlaceholderPage from '@/features/admin/pages/AdminPlaceholderPage';
import SystemStatusPage from '@/features/admin/pages/SystemStatusPage';
import MenusPage from '@/features/admin/pages/MenusPage';
import UsersPage from '@/features/admin/pages/UsersPage';
import SubjectsPage from '@/features/admin/pages/SubjectsPage';
import PlacementOnboardingPage from '@/features/onboarding/PlacementOnboardingPage';
import ParentLayout from '@/features/parent/ParentLayout';
import ParentDashboard from '@/features/parent/pages/ParentDashboard';
import ParentChildrenPage from '@/features/parent/pages/ParentChildrenPage';
import ParentSettingsPage from '@/features/parent/pages/ParentSettingsPage';
import ParentPlaceholderPage from '@/features/parent/pages/ParentPlaceholderPage';
import KidPlacementPage from '@/features/kid/KidPlacementPage';
import KidLayout from '@/features/kid/KidLayout';
import KidHomePage from '@/features/kid/KidHomePage';
import KidPlaceholderPage from '@/features/kid/KidPlaceholderPage';
import KidProfilePage from '@/features/kid/KidProfilePage';
import ProfileSwitchPage from '@/features/profiles/ProfileSwitchPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/profiles" element={<ProfileSwitchPage />} />
                <Route path="/kid" element={<KidLayout />}>
                    <Route index element={<KidHomePage />} />
                    <Route path="placement" element={<KidPlacementPage />} />
                    <Route path="learn" element={<KidPlaceholderPage title="Learn" />} />
                    <Route path="rewards" element={<KidPlaceholderPage title="Rewards" />} />
                    <Route path="progress" element={<KidPlaceholderPage title="Progress" />} />
                    <Route path="settings" element={<KidProfilePage />} />
                </Route>
                <Route path="/parent" element={<ParentLayout />}>
                    <Route index element={<ParentDashboard />} />
                    <Route path="onboarding" element={<PlacementOnboardingPage />} />
                    <Route
                        path="children"
                        element={<ParentChildrenPage />}
                    />
                    <Route
                        path="progress"
                        element={
                            <ParentPlaceholderPage
                                title="Progress"
                                body="Review placement results and learning activity across your children."
                            />
                        }
                    />
                    <Route
                        path="settings"
                        element={<ParentSettingsPage />}
                    />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="roles" element={<RolesPage />} />
                    <Route path="features" element={<FeaturesPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="system-status" element={<SystemStatusPage />} />
                    <Route path="menus" element={<MenusPage />} />
                    <Route path="subjects" element={<SubjectsPage />} />
                    <Route
                        path="skills"
                        element={<AdminPlaceholderPage titleKey="navSkills" bodyKey="skillsPageBody" />}
                    />
                    <Route path="users" element={<UsersPage />} />
                    <Route
                        path="audit"
                        element={<AdminPlaceholderPage titleKey="navAudit" bodyKey="auditPageBody" />}
                    />
                </Route>
                <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}
