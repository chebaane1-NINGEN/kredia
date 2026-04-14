# 🎯 KREDIA Manual Testing Guide

> **Date**: Current QA Session  
> **Frontend Port**: 5175 (Vite dev server)  
> **Backend Port**: 8086 (Spring Boot)  
> **Database**: MySQL kredia_db

---

## Quick Start - Manual UI Testing

### How to Access the Application

1. **Open your browser** and navigate to: `http://127.0.0.1:5175`
2. You should see the **KREDIA Home Page** with login options
3. Click **"Login"** to start testing

---

## Test Case 1: Admin Dashboard

### Prerequisites
- Account: `admin@kredia.com`
- Password: `Admin@123`
- Role: ADMIN

### Steps
1. Navigate to `http://127.0.0.1:5175/login`
2. Enter email: `admin@kredia.com`
3. Enter password: `Admin@123`
4. Click **"Sign In"**
5. Expected redirect: `http://127.0.0.1:5175/admin`

### Verification Checklist ✅

#### Dashboard/Statistics Page (`/admin`)
- [ ] Page loads without errors
- [ ] Title: "Dashboard" or "Statistics" visible
- [ ] **Stat Cards Display**:
  - [ ] "Total Users" card shows: 88
  - [ ] "Total Clients" card shows: 72
  - [ ] "Total Agents" card shows: 11
  - [ ] "Active Users" card shows: 69
  - [ ] "Blocked Users" card shows: 5
  - [ ] "System Health" card shows: ~78.41%

#### Charts Render
- [ ] Area chart displays registration evolution
- [ ] Bar chart displays user distribution
- [ ] Pie chart displays role distribution (Admin:5, Agent:11, Client:72)
- [ ] All charts display without errors or blank spaces

#### Admin Sidebar Navigation
Click each menu item and verify:
- [ ] **Dashboard** (active page, shows stats) ✓
- [ ] **Users Management** - List of users displays
- [ ] **Audit Log** - Audit entries display with timestamps
- [ ] **Reports** - Performance/reporting page loads
- [ ] **Settings** - Platform settings page loads
- [ ] **Messages** - Admin messages page loads
- [ ] **Profile** - Admin profile information displays

#### Users Management Page (`/admin/users`)
- [ ] "Add User" button visible in top-right
- [ ] User list displays (paginated, 10 per page)
- [ ] Search field functional (search by email)
- [ ] Status filter dropdown functional (All, Active, Suspended, Blocked)
- [ ] Users table columns: Email, Name, Status, Role, Actions
- [ ] Each row has "View", "Edit", "Delete" action buttons

#### Create New User (`/admin/users/new`)
- [ ] Click "Add User" button
- [ ] Form appears with fields:
  - [ ] Email (text input)
  - [ ] First Name (text input)
  - [ ] Last Name (text input)
  - [ ] Phone (optional text input)
  - [ ] Role (dropdown: ADMIN, AGENT, CLIENT)
  - [ ] Status (dropdown: ACTIVE, SUSPENDED, BLOCKED)
- [ ] Fill in test data:
  - Email: `test.admin@kredia.com`
  - First Name: Test
  - Last Name: Admin
  - Role: CLIENT
  - Status: ACTIVE
- [ ] Click "Create User"
- [ ] Expected: Redirect to `/admin/users` and new user appears in list

#### Edit User (`/admin/users/{id}`)
- [ ] Click "Edit" on any user
- [ ] Form prefill with user data
- [ ] Modify a field (e.g., phone number)
- [ ] Click "Save"
- [ ] Expected: Redirect to `/admin/users` and changes reflected

#### Audit Log Page (`/admin/audit`)
- [ ] Page loads showing activity timeline
- [ ] Display includes:
  - [ ] Action type (LOGIN, REGISTER, UPDATE, DELETE, etc.)
  - [ ] User email who performed action
  - [ ] Timestamp
  - [ ] Description (what changed)
- [ ] Filter by action type works
- [ ] Filter by date range works

#### Console Check
- [ ] Open browser DevTools: Press `F12` or right-click → "Inspect"
- [ ] Go to **Console** tab
- [ ] [ ] **No red errors** displayed
- [ ] [ ] **No TypeScript compilation warnings** (yellow warnings acceptable)
- [ ] [ ] Only normal log messages (blue 'i' info icons acceptable)

---

## Test Case 2: Agent Dashboard

### Prerequisites
- Account: `agent1@kredia.com`
- Password: `Agent@123`
- Role: AGENT

### Steps
1. **Logout** from admin account (click Logout button or clear browser storage)
2. Navigate to `http://127.0.0.1:5175/login`
3. Enter email: `agent1@kredia.com`
4. Enter password: `Agent@123`
5. Click **"Sign In"**
6. Expected redirect: `http://127.0.0.1:5175/agent/dashboard`

### Verification Checklist ✅

#### Dashboard Page (`/agent/dashboard`)
- [ ] Page loads without errors
- [ ] Title: "Agent Dashboard" visible
- [ ] Welcome message: "Hello, Agent1" (or display agent name)
- [ ] **Quick Stats Display**:
  - [ ] Total Clients: 7 (or actual assigned count)
  - [ ] Total Approvals: 3
  - [ ] Total Rejections: 0
- [ ] Quick links/action buttons visible (View Performance, Manage Clients, etc.)

#### Performance Page (`/agent/performance`)
- [ ] Click "Performance" in sidebar
- [ ] Page URL: `http://127.0.0.1:5175/agent/performance`
- [ ] **Performance Score Display**:
  - [ ] Large card showing: **100.0%**
  - [ ] Label: "Performance Score"
- [ ] **KPI Cards Display**:
  - [ ] "Total Approvals": 3
  - [ ] "Total Rejections": 0
  - [ ] "Success Rate": 100%
  - [ ] "Average Processing Time": 0 seconds
  - [ ] "Clients Handled": 7
- [ ] **Action Breakdown Pie Chart**:
  - [ ] Chart renders without errors ("actionBreakdown" bug fixed)
  - [ ] Legend shows action types and counts
  - [ ] Colors are distinct for each action type

#### My Clients Page (`/agent/clients`)
- [ ] Click "My Clients" in sidebar
- [ ] Page URL: `http://127.0.0.1:5175/agent/clients`
- [ ] **Client List Displays**:
  - [ ] Table with columns: Email, Name, Status, Phone, Registration Date, Actions
  - [ ] Pagination: Shows page 1 of N, 10 clients per page
  - [ ] Row data is visible and properly formatted
- [ ] **Filter Functionality**:
  - [ ] Search field filters by email/client name
  - [ ] Status dropdown filter (All, Active, Inactive, Blocked, Suspended)
- [ ] **Add Client Button**:
  - [ ] "Add Client" button visible in top-right
  - [ ] Click it → navigates to `/agent/clients/new`

#### Add Client Form (`/agent/clients/new`)
- [ ] Form appears with fields:
  - [ ] Email (text input)
  - [ ] First Name (text input)
  - [ ] Last Name (text input)
  - [ ] Phone (optional)
  - [ ] Status (dropdown)
- [ ] Fill in test data:
  - Email: `new.client.test@kredia.com`
  - First Name: New
  - Last Name: Client
  - Phone: +1234567890
- [ ] Click "Save Client"
- [ ] Expected: Redirect to `/agent/clients` and new client appears in list

#### Audit Log Page (`/agent/audit`)
- [ ] Click "Audit Log" in sidebar
- [ ] Page URL: `http://127.0.0.1:5175/agent/audit`
- [ ] Activity timeline displays
- [ ] Shows only this agent's actions (not other agents' or admin actions)
- [ ] Filter by action type and date range works

#### Agent Profile (`/agent/profile`)
- [ ] Click profile link/icon (usually top-right corner)
- [ ] Page URL: `http://127.0.0.1:5175/agent/profile`
- [ ] **Agent Information Display**:
  - [ ] Email: agent1@kredia.com
  - [ ] Name: Agent1 (or display name)
  - [ ] Role: AGENT
- [ ] **Edit Profile Form**:
  - [ ] Change phone number
  - [ ] Change address
  - [ ] Update password (if available)
  - [ ] Click "Save Changes"
  - [ ] Expected: Changes persisted and reflected on reload

#### Security & Access Control
- [ ] Try accessing `/admin` URL directly
  - [ ] Expected: Redirect to `/agent` (no admin access for agent)
- [ ] Try accessing `/client` URL directly
  - [ ] Expected: Redirect to `/agent` (no client access for agent)
- [ ] Try accessing another agent's clients (manually edit URL)
  - [ ] Expected: Error or empty results (cannot see other agents' data)

#### Console Check
- [ ] Open DevTools (F12) → Console tab
- [ ] [ ] **No red errors** displayed
- [ ] [ ] **No "Cannot read property 'map' of undefined"** (actionBreakdown bug is fixed)
- [ ] [ ] No TypeScript compilation warnings

---

## Test Case 3: Client Dashboard

### Prerequisites
- Account: `qa.user@kredia.com`
- Password: `NewClient@123` (or `Client@123` for other test clients)
- Role: CLIENT
- Email Status: VERIFIED ✅

### Steps
1. **Logout** from agent account
2. Navigate to `http://127.0.0.1:5175/login`
3. Enter email: `qa.user@kredia.com`
4. Enter password: `NewClient@123`
5. Click **"Sign In"**
6. Expected redirect: `http://127.0.0.1:5175/client`

### Verification Checklist ✅

#### Client Dashboard (`/client`)
- [ ] Page loads without errors
- [ ] Title: "My Account" or "Dashboard" visible
- [ ] Welcome message: "Hello, QA User" or similar
- [ ] **Account Status Summary**:
  - [ ] Email status: ✅ "Verified" or ✅ "Email Confirmed"
  - [ ] Account status: "Active"
  - [ ] Member since: Display registration date

#### Profile Page (`/client/profile`)
- [ ] Click "Profile" or "My Profile" link
- [ ] Page URL: `http://127.0.0.1:5175/client/profile`
- [ ] **Profile Information Display**:
  - [ ] Email: qa.user@kredia.com
  - [ ] Email Status: ✅ Verified
  - [ ] First Name: Qa
  - [ ] Last Name: User
  - [ ] Created Date: Display shown
  - [ ] Updated Date: Display shown
- [ ] **Edit Profile Form**:
  - [ ] "Edit" button visible
  - [ ] Click "Edit" to enable form fields
  - [ ] Modify phone number (if field visible)
  - [ ] Modify address (if field visible)
  - [ ] Click "Save Changes"
  - [ ] Expected: Toast notification showing "Profile updated successfully"
  - [ ] Changes persisted on page reload

#### Activities Page (`/client/activities`)
- [ ] Click "Activities" or "Activity Log"
- [ ] Page URL: `http://127.0.0.1:5175/client/activities`
- [ ] Activity timeline displays with entries such as:
  - [ ] "User registered" (registration date)
  - [ ] "Email verified" (verification date)
  - [ ] "Profile updated" (if updated)
  - [ ] "Logged in" (recent login)
- [ ] Each entry shows:
  - [ ] Action description
  - [ ] Timestamp
  - [ ] Optional: IP address or device info

#### Change Password (if available)
- [ ] Look for "Change Password" or "Security" section
- [ ] If available, click it
- [ ] Enter current password: `NewClient@123`
- [ ] Enter new password: `NewPassword@456` (or similar)
- [ ] Click "Save"
- [ ] Expected: Success message
- [ ] Test: Logout, attempt login with **old password** → should fail
- [ ] Test: Login with **new password** → should succeed

#### Security & Access Control
- [ ] Try accessing `/admin` URL directly
  - [ ] Expected: Redirect to `/client` (no admin access)
- [ ] Try accessing `/agent` URL directly
  - [ ] Expected: Redirect to `/client` (no agent access)
- [ ] Try accessing `/client/profile` (should work, shows own profile)
  - [ ] Expected: Client profile displays
- [ ] Try modifying URL to access another client's profile (`/client/profile/123` if applicable)
  - [ ] Expected: Error or redirect (cannot view other clients' profiles)

#### Logout Flow
- [ ] Click "Logout" button
- [ ] Expected actions:
  - [ ] Redirect to `/login` page
  - [ ] localStorage cleared (browser DevTools → Application → localStorage → verify kredia_token removed)
  - [ ] Attempt to access protected route (e.g., `/client`) → redirects to login

#### Console Check
- [ ] Open DevTools (F12) → Console tab
- [ ] [ ] **No red errors** displayed
- [ ] [ ] No TypeScript compilation warnings
- [ ] [ ] Only expected network calls visible (API requests to `/api/user/client/...`)

---

## Test Case 4: Authentication Edge Cases

### 4.1 Failed Login (Wrong Password)
1. Navigate to login page
2. Enter email: `admin@kredia.com`
3. Enter **wrong password**: `WrongPassword123`
4. Click "Sign In"
5. Expected:
   - [ ] Error message: "Invalid email or password"
   - [ ] No redirect to dashboard
   - [ ] User remains on login page

### 4.2 Blocked Account
1. Navigate to login page
2. Enter email: `client1@kredia.com` (known to be blocked from testing)
3. Enter any password: `Client@123`
4. Click "Sign In"
5. Expected:
   - [ ] Error message: "Account is blocked due to too many failed attempts"
   - [ ] No redirect
   - [ ] User remains on login page

### 4.3 Unregistered Email
1. Navigate to login page
2. Enter email: `nonexistent@kredia.com`
3. Enter password: `Password123`
4. Click "Sign In"
5. Expected:
   - [ ] Error message: "Invalid email or password" (no email enumeration vuln)
   - [ ] No redirect

### 4.4 Register New Account (Optional)
1. Navigate to registration page: `http://127.0.0.1:5175/register`
2. Fill form:
   - Email: `newtest@kredia.com`
   - First Name: New
   - Last Name: Test
   - Password: `NewTest@123`
   - Confirm Password: `NewTest@123`
3. Click "Register"
4. Expected:
   - [ ] "User registered successfully!" message
   - [ ] Redirect to email verification page
   - [ ] Display message: "Check your email to verify your account"

### 4.5 Verify Email (if you registered new account)
1. Check browser console for verification link (logged by backend stub)
2. Manually navigate to: `http://127.0.0.1:5175/verify-email?token={token}`
   - Extract token from console/backend logs
3. Expected:
   - [ ] Success message: "Email verified successfully"
   - [ ] Redirect to login page
   - [ ] New account now has verified email
   - [ ] Can login with this account

### 4.6 Password Reset (Optional)
1. Navigate to forgot password: `http://127.0.0.1:5175/forgot-password`
2. Enter email: `qa.user@kredia.com`
3. Click "Send Reset Link"
4. Expected:
   - [ ] Message: "If an email exists, a reset link has been sent"
5. Check console logs for reset link (backend logs)
6. Manually navigate to: `http://127.0.0.1:5175/reset-password?token={token}`
   - Extract token from logs
7. Expected form appears with:
   - [ ] New password field
   - [ ] Confirm password field
8. Enter new password: `ResetPassword@789`
9. Click "Reset Password"
10. Expected:
    - [ ] Success message
    - [ ] Redirect to login page
11. Login with:
    - Email: `qa.user@kredia.com`
    - Password: `ResetPassword@789` (new password)
    - Expected: ✅ Successful login

---

## Console & Network Validation

### Browser DevTools Checks

#### 1. Console Tab (F12 → Console)
- [ ] **No Red Errors** (application blocking errors not acceptable)
- [ ] Acceptable items:
  - [ ] Blue info logs (i icon)
  - [ ] Yellow warnings (⚠️ - generally acceptable, debug info)
  - [ ] Network logs for API calls
- [ ] **Verify No Component Errors**:
  - [ ] "Cannot read property X of undefined"
  - [ ] "Missing required prop"
  - [ ] "Unexpected react context"

#### 2. Network Tab (F12 → Network)
- [ ] Set filter to "Fetch/XHR"
- [ ] Perform a login action
- [ ] Expected API calls:
  - [ ] `POST /api/auth/login` → 200 response with JWT token
  - [ ] `GET /api/user/admin/stats` (if admin) → 200 with stats object
  - [ ] `GET /api/user/agent/6/performance` (if agent) → 200 with performance data
  - [ ] `GET /api/user/client/88/profile` (if client) → 200 with profile data
- [ ] Verify **no 401 (Unauthorized) or 403 (Forbidden)** errors for authorized requests
- [ ] Verify **all API responses contain "success": true** in response body

#### 3. Application/Storage Tab (F12 → Application)
- [ ] Expand "Local Storage"
- [ ] Select `http://127.0.0.1:5175`
- [ ] Verify after **successful login**:
  - [ ] `kredia_token` exists and contains JWT (starts with `eyJ...`)
  - [ ] `kredia_role` exists and contains role (ADMIN, AGENT, or CLIENT)
  - [ ] `kredia_user_id` exists and contains numeric user ID
  - [ ] `kredia_actor_id` exists (duplicate of user_id for API headers)
- [ ] Verify after **logout**:
  - [ ] All `kredia_*` keys are **removed** from localStorage

---

## Final Validation Checklist

### ✅ All Dashboards Operational
- [ ] **Admin Dashboard**: Statistics page loads, users manageable, audit visible
- [ ] **Agent Dashboard**: Performance visible, clients manageable, activities logged
- [ ] **Client Dashboard**: Profile editable, activities visible, email verified status shown

### ✅ Authentication Working
- [ ] [ ] Successful login redirects to role-appropriate dashboard
- [ ] [ ] Failed login shows error and stays on login page
- [ ] [ ] Logout clears session and redirects to login
- [ ] [ ] Password reset flow works end-to-end

### ✅ RBAC Enforced
- [ ] Admins cannot see agent/client pages
- [ ] Agents cannot see admin/client pages
- [ ] Clients cannot see admin/agent pages
- [ ] API endpoints return 403 for cross-role access attempts

### ✅ No Critical Errors
- [ ] [ ] No TypeScript compilation errors in console
- [ ] [ ] No runtime exceptions or crashes
- [ ] [ ] All forms submit and save successfully
- [ ] [ ] Navigation between pages works smoothly

### ✅ Security Verified
- [ ] JWT token present in localStorage after login
- [ ] Token sends in Authorization header on API calls
- [ ] X-Actor-Id header prevents cross-user data access
- [ ] Failed logins show generic error messages (no email enumeration)

---

## Quick Reference - Test Accounts

| Role | Email | Password | Status | Email Verified |
|------|-------|----------|--------|---|
| ADMIN | `admin@kredia.com` | `Admin@123` | ACTIVE | ✅ |
| AGENT | `agent1@kredia.com` | `Agent@123` | ACTIVE | ✅ |
| CLIENT | `qa.user@kredia.com` | `NewClient@123` | ACTIVE | ✅ |
| CLIENT | `client1@kredia.com` | `Client@123` | **BLOCKED** | ✅ |
| CLIENT (test) | `new.client@kredia.com` | - | PENDING_VERIFICATION | ❌ |

---

## Report Results

After completing all tests above, document:

1. **Overall Status**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
2. **Failed Tests**: List any failed test cases
3. **Console Errors**: List any critical errors found
4. **Fix Priority**: Mark which issues need immediate attention
5. **Recommendation**: Ready for production / needs fixes / needs review

**Testing Completed By**: [Your Name]  
**Date**: [Date]  
**Time Spent**: [Duration]

---

**Next Steps After Testing**:
1. If all ✅ **PASS**: Application ready for deployment
2. If ⚠️ **PARTIAL**: Document issues and create bug fixes
3. If ❌ **FAIL**: Critical issues found, halt deployment, notify dev team

