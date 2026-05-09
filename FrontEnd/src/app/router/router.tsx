import { createBrowserRouter } from 'react-router-dom'
import { AdminDashboard } from '@/admin/pages/AdminDashboard/AdminDashboard'
import { AccessRequests } from '@/admin/pages/AccessRequests/AccessRequests'
import { ManageEvents } from '@/admin/pages/ManageEvents/ManageEvents'
import { ManageUsers } from '@/admin/pages/ManageUsers/ManageUsers'
import { SiteSettings } from '@/admin/pages/SiteSettings/SiteSettings'
import { AdminLayout } from '@/app/layouts/AdminLayout/AdminLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout/MainLayout'
import { Birthdays } from '@/pages/Birthdays/Birthdays'
import { CreateEvent } from '@/pages/Events/CreateEvent/CreateEvent'
import { EventDetail } from '@/pages/Events/EventDetail/EventDetail'
import { Events } from '@/pages/Events/Events'
import { Home } from '@/pages/Home/Home'
import { Login } from '@/pages/Login/Login'
import { Landing } from '@/pages/Landing/Landing'
import { NotFound } from '@/pages/NotFound/NotFound'
import { Notifications } from '@/pages/Notifications/Notifications'
import { Profile } from '@/pages/Profile/Profile'
import { RequestAccess } from '@/pages/RequestAccess/RequestAccess'
import { Users } from '@/pages/Users/Users'
import { RouteError } from '@/components/feedback/RouteError/RouteError'
import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/login', element: <Login /> },
      { path: '/request-access', element: <RequestAccess /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/events', element: <Events /> },
          { path: '/events/:id', element: <EventDetail /> },
          { path: '/events/create', element: <CreateEvent /> },
          { path: '/birthdays', element: <Birthdays /> },
          { path: '/users', element: <Users /> },
          { path: '/profile', element: <Profile /> },
          { path: '/notifications', element: <Notifications /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/users', element: <ManageUsers /> },
          { path: '/admin/events', element: <ManageEvents /> },
          { path: '/admin/access-requests', element: <AccessRequests /> },
          { path: '/admin/settings', element: <SiteSettings /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound />, errorElement: <RouteError /> },
])
