import { AuthProvider } from "./context/AuthContext";
import AppShell from "./app/AppShell";
import AppErrorBoundary from "./app/layout/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AppErrorBoundary>
  );
}
