import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NewChecklist from "./pages/NewChecklist";
import Reports from "./pages/Reports";
import ChecklistEditor from "./pages/ChecklistEditor";
import VehicleManagement from "./pages/VehicleManagement";
import ChecklistView from "./pages/ChecklistView";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checklist/new" element={<NewChecklist />} />
            <Route path="/checklist/view/:id" element={<ChecklistView />} />
            <Route path="/checklist/edit/:id" element={<NewChecklist />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/checklist-editor" element={<ChecklistEditor />} />
            <Route path="/vehicles" element={<VehicleManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
