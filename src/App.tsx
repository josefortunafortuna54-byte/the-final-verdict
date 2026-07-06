import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";

const Arena = lazy(() => import("./pages/Arena"));
const Publico = lazy(() => import("./pages/Publico"));
const Stats = lazy(() => import("./pages/Stats"));
const BaseDados = lazy(() => import("./pages/BaseDados"));
const GladiadorPerfil = lazy(() => import("./pages/GladiadorPerfil"));
const Apresentacao = lazy(() => import("./pages/Apresentacao"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="font-display text-xl text-primary animate-pulse-glow">CARREGANDO...</p>
    </div>
  </div>
);

const App = () => {
  useAuth();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/arena" element={<Arena />} />
                <Route path="/publico" element={<Publico />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/base-dados" element={<BaseDados />} />
                <Route path="/gladiador/:id" element={<GladiadorPerfil />} />
                <Route path="/apresentacao" element={<Apresentacao />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
