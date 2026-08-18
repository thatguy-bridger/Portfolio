import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { LoginPage } from './auth/LoginPage';
import { PublicSite } from './routes/PublicSite';
import { Builder } from './routes/Builder';
import { WidgetStudio } from './routes/WidgetStudio';
import { Inbox } from './routes/Inbox';
import { ProjectPage } from './routes/ProjectPage';
import { PreviewAsVisitor } from './routes/PreviewAsVisitor';
import { VersionHistory } from './routes/VersionHistory';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicSite />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/edit"
              element={
                <RequireAuth>
                  <Builder />
                </RequireAuth>
              }
            />
            <Route
              path="/edit/widgets"
              element={
                <RequireAuth>
                  <WidgetStudio />
                </RequireAuth>
              }
            />
            <Route
              path="/edit/messages"
              element={
                <RequireAuth>
                  <Inbox />
                </RequireAuth>
              }
            />
            {/* Homepage Studio is retired — the homepage is now just a pinned entry in the Builder's page sidebar. */}
            <Route path="/edit/homepage" element={<Navigate to="/edit" replace />} />
            <Route
              path="/edit/preview"
              element={
                <RequireAuth>
                  <PreviewAsVisitor />
                </RequireAuth>
              }
            />
            <Route
              path="/edit/history"
              element={
                <RequireAuth>
                  <VersionHistory />
                </RequireAuth>
              }
            />
            {/* Custom pages live at any path the user picks (e.g. /school/clubs/justserve) — matched last, after the fixed routes above. */}
            <Route path="/*" element={<ProjectPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
