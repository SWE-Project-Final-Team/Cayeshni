# Authentication Use Case Diagram

```mermaid
graph TB
    User((User))
    
    User -->|No Account| Register["Register<br/>Email, Name, Password"]
    User -->|Has Account| Login["Login<br/>Email, Password"]
    
    Register -->|Success| EmailConfirm["Email Confirmation<br/>Required"]
    Register -->|Returns| TokenPair["Access Token<br/>Refresh Token"]
    
    Login -->|Success| AuthCheck{Email<br/>Confirmed?}
    AuthCheck -->|Yes| FullAccess["Full Access"]
    AuthCheck -->|No| Limited["Limited Access"]
    
    Login -->|Failed| Error["Invalid Credentials"]
    
    User -->|Authenticated| Session["Active Session"]
    Session -->|Expired| Refresh["Refresh Token<br/>Get New Access Token"]
    Refresh -->|Valid| NewTokens["New Token Pair"]
    Refresh -->|Expired| ReAuth["Re-authenticate"]
    
    Session -->|Done| Logout["Logout<br/>Clear Session"]
    
    User -->|Forgot Password| ForgotFlow["Forgot Password<br/>Email Reset Link"]
    ForgotFlow -->|Link Sent| ResetEmail["Reset Email<br/>Click Link"]
    ResetEmail -->|Token Valid| ResetPassword["Reset Password<br/>New Password"]
    ResetPassword -->|Success| PasswordReset["Password Updated"]
    
    User -->|Unconfirmed Email| ResendEmail["Resend Confirmation<br/>Email"]
    ResendEmail -->|Sent| ConfirmEmail["Confirm Email<br/>Click Link"]
    ConfirmEmail -->|Token Valid| EmailConfirmed["Email Confirmed"]
    
    User -->|Authenticated| ChangePass["Change Password<br/>Current + New"]
    ChangePass -->|Success| PassChanged["Password Updated"]
    
    style Register fill:#e1f5ff
    style Login fill:#e1f5ff
    style Refresh fill:#fff3e0
    style Logout fill:#ffebee
    style TokenPair fill:#f1f8e9
    style AuthCheck fill:#f3e5f5
    style FullAccess fill:#c8e6c9
    style Limited fill:#fff9c4
    style ForgotFlow fill:#ffe0b2
    style ResetPassword fill:#ffe0b2
    style ConfirmEmail fill:#b2dfdb
    style ChangePass fill:#e1bee7
    style Error fill:#ffcdd2
```

## Description

This diagram shows all user interactions with the authentication system:

### Account Management
- **Register**: Create new account with email, name, password, and preferred currency
  - Validates email format and name length (≥3 chars)
  - Returns access and refresh tokens
  - Requires email confirmation for full access

- **Login**: Authenticate with email and password
  - Returns tokens on success
  - Email confirmation status affects access level
  - Invalid credentials return error

- **Logout**: End authenticated session
  - Clears refresh token cookie
  - Invalidates session

### Session Management
- **Refresh Token**: Extend session with valid refresh token
  - Returns new token pair without re-entering credentials
  - Refresh token expiration requires re-authentication
  - Prevents excessive login prompts

### Password Management
- **Change Password**: Update password while authenticated
  - Requires current password verification
  - Sets new password immediately

- **Forgot Password**: Reset password via email link
  - Sends reset link to email address
  - Link contains time-limited token
  - User sets new password using token

### Email Verification
- **Confirm Email**: Verify email ownership via link
  - Enables full feature access
  - Link sent during registration
  - Users can resend if needed

- **Resend Confirmation**: Re-send email verification
  - Rate-limited to prevent abuse
  - Required before full access

### Error Handling
- Invalid email format
- Invalid credentials
- Expired tokens
- Rate limiting on sensitive operations
