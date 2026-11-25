import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { BootScreen } from './components/EmptyState.tsx'
import { useAuth } from './context/AuthContext.tsx'
import { AuthPage } from './pages/AuthPage.tsx'
import { EditorPage } from './pages/EditorPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LibraryPage } from './pages/LibraryPage.tsx'
import { NotesPage } from './pages/NotesPage.tsx'
import { AccountPage } from './pages/AccountPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { TrashPage } from './pages/TrashPage.tsx'

function RequireAuth() {
  const { user, ready } = useAuth()
  if (!ready) return <BootScreen />
  if (!user) return <Navigate to="/login" replace />
  return <AppShell />
}

function GuestOnly() {
  const { user, ready } = useAuth()
  if (!ready) return <BootScreen />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/notes', element: <NotesPage /> },
      { path: '/notes/:id', element: <EditorPage /> },
      { path: '/folders', element: <LibraryPage /> },
      { path: '/trash', element: <TrashPage /> },
      { path: '/me', element: <ProfilePage /> },
      { path: '/me/account', element: <AccountPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
