import { AuthProvider } from "./context/AuthContext";
import AppShell from "./app/AppShell";

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
