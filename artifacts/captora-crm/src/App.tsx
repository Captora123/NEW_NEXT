import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Shoots from "@/pages/shoots";
import Payments from "@/pages/payments";
import Freelancers from "@/pages/freelancers";
import Staff from "@/pages/staff";
import Expenses from "@/pages/expenses";
import Profit from "@/pages/profit";
import Finance from "@/pages/finance";
import Deliverables from "@/pages/deliverables";
import Content from "@/pages/content";
import TeamPlanner from "@/pages/team-planner";
import Settings from "@/pages/settings";
import { AppLayout } from "@/components/layout/app-layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType; path: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} path="/dashboard" /></Route>
      <Route path="/clients"><ProtectedRoute component={Clients} path="/clients" /></Route>
      <Route path="/clients/:id"><ProtectedRoute component={ClientDetail} path="/clients/:id" /></Route>
      <Route path="/shoots"><ProtectedRoute component={Shoots} path="/shoots" /></Route>
      <Route path="/payments"><ProtectedRoute component={Payments} path="/payments" /></Route>
      <Route path="/freelancers"><ProtectedRoute component={Freelancers} path="/freelancers" /></Route>
      <Route path="/staff"><ProtectedRoute component={Staff} path="/staff" /></Route>
      <Route path="/expenses"><ProtectedRoute component={Expenses} path="/expenses" /></Route>
      <Route path="/profit"><ProtectedRoute component={Profit} path="/profit" /></Route>
      <Route path="/finance"><ProtectedRoute component={Finance} path="/finance" /></Route>
      <Route path="/deliverables"><ProtectedRoute component={Deliverables} path="/deliverables" /></Route>
      <Route path="/content"><ProtectedRoute component={Content} path="/content" /></Route>
      <Route path="/team-planner"><ProtectedRoute component={TeamPlanner} path="/team-planner" /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} path="/settings" /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
