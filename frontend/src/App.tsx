import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Academy from "./pages/Academy";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CoursePlayer from "./pages/CoursePlayer";
import Passport from "./pages/Passport";
import CredentialDisplay from "./pages/CredentialDisplay";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import OperatorDashboard from "./pages/OperatorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/training" element={<Academy />} />
            <Route path="/training/:slug" element={<CourseDetail />} />
            <Route path="/learn/:courseSlug/:moduleSlug" element={<CoursePlayer />} />
            <Route path="/passport/:username" element={<Passport />} />
            <Route path="/p/:username" element={<Passport />} />
            <Route path="/certifications/:id" element={<CredentialDisplay />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/operator" element={<OperatorDashboard />} />
            <Route path="/operator/:tab" element={<OperatorDashboard />} />
            {/* Legacy redirects */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/credentials/:id" element={<CredentialDisplay />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
