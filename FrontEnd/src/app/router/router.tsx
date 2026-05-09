import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'

import { Landing } from '@/pages/public/Landing'
import { Login } from '@/pages/public/Login'
import { RequestAccess } from '@/pages/public/RequestAccess'
import { PendingApproval } from '@/pages/public/PendingApproval'

import { Home } from '@/pages/user/Home'
import { Events } from '@/pages/user/Events'
import { EventDetail } from '@/pages/user/EventDetail'
import { CreateEvent } from '@/pages/user/CreateEvent'
import { Birthdays } from '@/pages/user/Birthdays'
import { Family } from '@/pages/user/Family'
import { Notifications } from '@/pages/user/Notifications'
import { Profile } from '@/pages/user/Profile'
import { Messages } from '@/pages/user/Messages'

import { AdminHome } from '@/pages/admin/AdminHome'
import { ManageUsers } from '@/pages/admin/ManageUsers'
import { ManageEvents } from '@/pages/admin/ManageEvents'
import { AccessRequests } from '@/pages/admin/AccessRequests'
import { Settings } from '@/pages/admin/Settings'

import { RouteError } from '@/components/feedback/RouteError'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Landing /> },
      { path: '/login', element: <Login /> },
      { path: '/request-access', element: <RequestAccess /> },
      { path: '/pending-approval', element: <PendingApproval /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: '/home', element: <Home /> },
          { path: '/events', element: <Events /> },
          { path: '/events/create', element: <CreateEvent /> },
          { path: '/events/:id', element: <EventDetail /> },
          { path: '/birthdays', element: <Birthdays /> },
          { path: '/family', element: <Family /> },
          { path: '/messages', element: <Messages /> },
          { path: '/notifications', element: <Notifications /> },
          { path: '/profile', element: <Profile /> },
          { path: '/users', element: <Navigate to="/family" replace /> },
          { path: '*', element: <Navigate to="/home" replace /> },
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
          { path: '/admin', element: <AdminHome /> },
          { path: '/admin/users', element: <ManageUsers /> },
          { path: '/admin/events', element: <ManageEvents /> },
          { path: '/admin/access-requests', element: <AccessRequests /> },
          { path: '/admin/settings', element: <Settings /> },
        ],
      },
    ],
  },
])


