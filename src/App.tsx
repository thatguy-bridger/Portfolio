import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { LoginPage } from './auth/LoginPage';
import { PublicSite } from './routes/PublicSite';
import { Builder } from './routes/Builder';
import { ProjectPage } from './routes/ProjectPage';

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
            {/* Custom pages live at any path the user picks (e.g. /school/clubs/justserve) — matched last, after the fixed routes above. */}
            <Route path="/*" element={<ProjectPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
