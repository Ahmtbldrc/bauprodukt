# Admin Login Guide

## Overview

The admin login system has been implemented with role-based authentication. This guide explains how to use the admin login functionality.

## Admin Login Page

### URL
- Admin Login: `/admin-login`
- Admin Dashboard: `/admin`

### Features

1. **Role-based Authentication**: Only users with `admin` role can access admin pages
2. **Secure Login Form**: Admin-specific login form with blue color scheme
3. **Remember Me**: Admin credentials can be remembered separately from regular user credentials
4. **Route Protection**: All admin routes are protected by `AdminRoute` component
5. **Automatic Redirects**: 
   - Unauthenticated users → `/admin/login`
   - Non-admin users → `/` (homepage)
   - Admin users → `/admin` (dashboard)

## Test Credentials

### Admin User
- **Email**: `admin@bauprodukt.com`
- **Password**: `admin123`
- **Role**: `admin`

### Regular User
- **Email**: `kadir@example.ch`
- **Password**: `kadir123`
- **Role**: `user`

## Implementation Details

### Components

1. **AdminLoginForm** (`src/components/auth/AdminLoginForm.tsx`)
   - Admin-specific login form
   - Blue color scheme
   - Separate localStorage keys for admin credentials
   - Redirects to `/admin` on successful login

2. **AdminRoute** (`src/components/auth/AdminRoute.tsx`)
   - Route protection component
   - Checks authentication and admin role
   - Shows loading states during checks
   - Handles redirects automatically

3. **Admin Login Page** (`src/app/admin-login/page.tsx`)
   - Admin login page layout
   - Navigation links to home and admin panel
   - Blue gradient background

### Authentication Flow

1. User visits `/admin-login`
2. Enters admin credentials
3. System validates credentials against mock data
4. If valid admin user → redirect to `/admin`
5. If invalid → show error message
6. If non-admin user → redirect to `/`

### Storage Keys

- **Admin Credentials**: `bauprodukt_admin_remember_email`, `bauprodukt_admin_remember_password`
- **Regular Credentials**: `bauprodukt_remember_email`, `bauprodukt_remember_password`
- **User Data**: `bauprodukt_auth_user`
- **Auth Token**: `bauprodukt_auth_token`

## Usage

### For Developers

1. **Access Admin Login**: Navigate to `/admin/login`
2. **Test Admin Access**: Use admin credentials to access dashboard
3. **Test Route Protection**: Try accessing `/admin` without login
4. **Test Role Protection**: Login with regular user and try accessing `/admin`

### For Users

1. Navigate to `/admin-login`
2. Enter admin credentials
3. Click "Admin Anmelden"
4. Access admin dashboard at `/admin`

## Security Features

- **Role-based Access Control**: Only admin users can access admin pages
- **Separate Credential Storage**: Admin and user credentials are stored separately
- **Automatic Redirects**: Unauthorized access attempts are redirected appropriately
- **Loading States**: Clear feedback during authentication checks

## Future Enhancements

- [ ] Real backend integration
- [ ] JWT token authentication
- [ ] Password hashing
- [ ] Session management
- [ ] Admin user management
- [ ] Audit logging
