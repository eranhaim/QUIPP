import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Academy from "./pages/Academy";
import CourseDetail from "./pages/CourseDetail";
import CoursePlayer from "./pages/CoursePlayer";
import Passport from "./pages/Passport";
import MyPassportRedirect from "./pages/MyPassportRedirect";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import OperatorDashboard from "./pages/OperatorDashboard";
import NotFound from "./pages/NotFound";
import DeepSubmit from "./pages/DeepSubmit";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEditor from "./pages/admin/AdminCourseEditor";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminDeepSubmissions from "./pages/admin/AdminDeepSubmissions";
import QuippyChat from "./components/QuippyChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/passport/:username" element={<Passport />} />
            <Route path="/p/:username" element={<Passport />} />
            <Route path="/verify/:id" element={<Verify />} />

            {/* Authenticated routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academy"
              element={
                <ProtectedRoute>
                  <Academy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/training/:slug"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/:slug"
              element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/:slug/*"
              element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/passport/me"
              element={
                <ProtectedRoute>
                  <MyPassportRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credentials"
              element={
                <ProtectedRoute>
                  <MyPassportRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/passport/deep/:credentialId"
              element={
                <ProtectedRoute>
                  <DeepSubmit />
                </ProtectedRoute>
              }
            />

            {/* Operator-only routes */}
            <Route
              path="/operator"
              element={
                <ProtectedRoute role="operator">
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/:tab"
              element={
                <ProtectedRoute role="operator">
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="courses" replace />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:slug" element={<AdminCourseEditor />} />
              <Route path="videos" element={<AdminVideos />} />
              <Route path="deep-submissions" element={<AdminDeepSubmissions />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/training" element={<Navigate to="/academy" replace />} />
            <Route path="/courses" element={<Navigate to="/academy" replace />} />
            <Route path="/courses/:slug" element={<Navigate to="/academy" replace />} />
            <Route path="/certifications/:id" element={<Navigate to="/credentials" replace />} />
            <Route path="/credentials/:id" element={<Navigate to="/credentials" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <QuippyChat />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
