import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { Sessions, UsersPage, Logs, SettingsPage } from "./pages/Placeholders";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.08)", fontSize: "14px" },
            success: { iconTheme: { primary: "#34d399", secondary: "#1e293b" } },
            error:   { iconTheme: { primary: "#f87171", secondary: "#1e293b" } },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
          }/>
          <Route path="/sessions" element={
            <ProtectedRoute><AppLayout><Sessions /></AppLayout></ProtectedRoute>
          }/>
          <Route path="/users" element={
            <ProtectedRoute><AppLayout><UsersPage /></AppLayout></ProtectedRoute>
          }/>
          <Route path="/logs" element={
            <ProtectedRoute><AppLayout><Logs /></AppLayout></ProtectedRoute>
          }/>
          <Route path="/settings" element={
            <ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
