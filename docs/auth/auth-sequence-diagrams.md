# Authentication Sequence Diagrams

## Register Flow

```mermaid
sequenceDiagram
    participant User as User/Client
    participant Controller as AuthController
    participant Service as AuthService
    participant Identity as IIdentityService
    participant Email as Email Service
    
    User->>Controller: POST /api/auth/register<br/>RegisterDto
    
    Controller->>Service: RegisterAsync(dto)
    
    Service->>Service: Trim name
    Service->>Service: Validate name length >= 3
    alt Invalid name
        Service-->>Controller: ValidationException
        Controller-->>User: 400 Bad Request
    end
    
    Service->>Service: Validate email format
    alt Invalid email
        Service-->>Controller: ValidationException
        Controller-->>User: 400 Bad Request
    end
    
    Service->>Identity: RegisterAsync(trimmed dto)
    
    Identity->>Identity: Hash password
    Identity->>Identity: Check email not registered
    alt Email already exists
        Identity-->>Service: DuplicateEmailException
        Service-->>Controller: ValidationException
        Controller-->>User: 400 Bad Request
    end
    
    Identity->>Identity: Create AppUser entity
    Identity->>Identity: Create default preferences
    Identity->>Identity: Generate email confirmation token
    Identity->>Email: Send confirmation email
    Email-->>Email: Send async
    
    Identity-->>Service: TokenPairDto
    Service-->>Controller: TokenPairDto
    
    Controller->>Controller: Set refresh token cookie
    Controller->>Controller: Extract email confirmed status
    Controller-->>User: 200 OK with AuthResponseDto
    
    Note over User: Tokens ready<br/>Email pending confirmation
```

### Process Steps
1. User submits registration details
2. Service validates name (trimmed, ≥3 characters)
3. Service validates email format (RFC-like)
4. Identity service checks email uniqueness
5. Password is hashed using secure algorithm
6. AppUser and preferences created in database
7. Email confirmation token generated
8. Confirmation email sent (async)
9. Refresh token set in httpOnly cookie
10. Access token returned in response body

---

## Login Flow

```mermaid
sequenceDiagram
    participant User as User/Client
    participant Controller as AuthController
    participant Service as AuthService
    participant Identity as IIdentityService
    participant DB as AppDbContext
    
    User->>Controller: POST /api/auth/login<br/>LoginDto
    
    Controller->>Service: LoginAsync(dto)
    Service->>Identity: LoginAsync(dto)
    
    Identity->>DB: Query user by email
    alt User not found
        Identity-->>Service: UnauthorizedException
        Service-->>Controller: UnauthorizedException
        Controller-->>User: 401 Unauthorized
    end
    
    Identity->>Identity: Hash provided password
    Identity->>Identity: Compare with stored hash
    alt Password mismatch
        Identity-->>Service: UnauthorizedException
        Service-->>Controller: UnauthorizedException
        Controller-->>User: 401 Unauthorized
    end
    
    Identity->>Identity: User authenticated ✓
    Identity->>Identity: Check email confirmed status
    Identity->>Identity: Generate access token (JWT)
    Identity->>Identity: Generate refresh token
    Identity->>DB: Store refresh token hash
    
    Identity-->>Service: TokenPairDto
    Service-->>Controller: TokenPairDto
    
    Controller->>Controller: Set refresh token cookie
    Controller->>Controller: Create AuthResponseDto<br/>with EmailConfirmed status
    Controller-->>User: 200 OK with AuthResponseDto
    
    Note over User: Access Token in body<br/>Refresh Token in cookie<br/>EmailConfirmed status included
```

### Process Steps
1. User submits email and password
2. Service queries database for user
3. If not found: return 401 Unauthorized
4. Password hash compared (timing-safe)
5. If mismatch: return 401 Unauthorized
6. Email confirmation status checked
7. JWT access token generated (expires: 15min typical)
8. Refresh token generated (expires: 7 days typical)
9. Refresh token hash stored in database
10. Refresh token set in httpOnly cookie (secure, sameSite)
11. Access token returned in response
12. EmailConfirmed flag indicates full vs. limited access

---

## Refresh Token Flow

```mermaid
sequenceDiagram
    participant User as User/Client
    participant Controller as AuthController
    participant Service as AuthService
    participant Identity as IIdentityService
    participant DB as AppDbContext
    
    User->>Controller: POST /api/auth/refresh<br/>(Refresh Token in Cookie)
    
    Controller->>Controller: Extract refresh token from cookie
    alt Token missing
        Controller-->>User: 401 Unauthorized
    end
    
    Controller->>Service: RefreshTokenAsync(refreshToken)
    Service->>Identity: RefreshTokenAsync(refreshToken)
    
    Identity->>DB: Query refresh token record
    alt Record not found or expired
        Identity-->>Service: UnauthorizedException
        Service-->>Controller: UnauthorizedException
        Controller-->>User: 401 Unauthorized
    end
    
    Identity->>Identity: Compare token hashes
    alt Hash mismatch
        Identity-->>Service: UnauthorizedException
        Service-->>Controller: UnauthorizedException
        Controller-->>User: 401 Unauthorized
    end
    
    Identity->>DB: Load user and claims
    Identity->>Identity: Generate new access token
    Identity->>Identity: Generate new refresh token
    Identity->>DB: Update refresh token record
    
    Identity-->>Service: New TokenPairDto
    Service-->>Controller: New TokenPairDto
    
    Controller->>Controller: Set new refresh token cookie
    Controller-->>User: 200 OK with new tokens
    
    Note over User: New Access Token valid<br/>New Refresh Token in cookie<br/>Session extended
```

### Process Steps
1. Client sends refresh request with token in httpOnly cookie
2. Controller extracts refresh token from secure cookie
3. Service validates token exists and not expired
4. Token hash verified against database record
5. User and claims loaded
6. New access token generated
7. New refresh token generated
8. Old refresh token replaced in database
9. New refresh token set in cookie
10. New access token returned in response
11. Session effectively extended for another interval

---

## Email Confirmation Flow

```mermaid
sequenceDiagram
    participant User as User/Client
    participant Email as Email Client
    participant Frontend as Frontend App
    participant Controller as AuthController
    participant Service as AuthService
    participant Identity as IIdentityService
    participant DB as AppDbContext
    
    Note over User,Identity: User clicks confirmation link in email
    Email-->>Frontend: Confirmation Link<br/>with UserId + Token
    
    Frontend->>Frontend: Extract token from URL
    Frontend->>Controller: POST /api/auth/confirm-email<br/>ConfirmEmailDto
    
    Controller->>Service: ConfirmEmailAsync(dto)
    Service->>Identity: ConfirmEmailAsync(dto)
    
    Identity->>DB: Query user by UserId
    alt User not found
        Identity-->>Service: NotFoundException
        Service-->>Controller: NotFoundException
        Controller-->>Frontend: 404 Not Found
    end
    
    Identity->>DB: Validate confirmation token
    alt Token invalid or expired
        Identity-->>Service: ValidationException
        Service-->>Controller: ValidationException
        Controller-->>Frontend: 400 Bad Request
    end
    
    Identity->>DB: Update user: EmailConfirmed = true
    Identity->>DB: Delete token record
    Identity->>DB: SaveChanges()
    
    Identity-->>Service: Success
    Service-->>Controller: Success
    Controller-->>Frontend: 204 No Content
    
    Frontend-->>User: ✓ Email confirmed!<br/>Redirect to login
```

### Process Steps
1. User receives email with confirmation link
2. Link contains: userId and confirmation token
3. User clicks link (from email or copy-paste)
4. Frontend extracts parameters from URL
5. Frontend calls confirmation endpoint
6. Service validates token against database
7. Token checked for expiration
8. User's EmailConfirmed flag updated
9. Confirmation token record deleted
10. Success response sent
11. Frontend redirects to login or dashboard

---

## Forgot Password & Reset Flow

```mermaid
sequenceDiagram
    participant User as User/Client
    participant Frontend as Frontend App
    participant Controller as AuthController
    participant Service as AuthService
    participant Identity as IIdentityService
    participant Email as Email Service
    participant DB as AppDbContext
    
    User->>Frontend: Click "Forgot Password"
    Frontend->>Frontend: Show email input form
    User->>Frontend: Enter email
    Frontend->>Controller: POST /api/auth/forgot-password<br/>ForgotPasswordDto
    
    Controller->>Service: ForgotPasswordAsync(email)
    Service->>Identity: ForgotPasswordAsync(email)
    
    Note over Identity: Rate limited to prevent abuse
    
    Identity->>DB: Query user by email (if exists)
    Identity->>Identity: Generate reset token<br/>(time-limited: 24hrs typical)
    Identity->>Email: Send reset email<br/>with token
    Email-->>Email: Send async
    
    Identity-->>Service: Success (or silently fail)
    Service-->>Controller: Success
    Controller-->>Frontend: 200 OK<br/>"Check email for reset link"
    
    Note over Frontend,User: Generic message prevents<br/>email enumeration attacks
    
    User->>Email: Clicks reset link in email
    Email-->>Frontend: Reset link<br/>with email + token
    Frontend->>Frontend: Show new password form
    User->>Frontend: Enter new password
    
    Frontend->>Controller: POST /api/auth/reset-password<br/>ResetPasswordDto
    
    Controller->>Service: ResetPasswordAsync(dto)
    Service->>Identity: ResetPasswordAsync(dto)
    
    Identity->>DB: Query user by email
    alt User not found
        Identity-->>Service: Success (silent)
        Service-->>Controller: Success
        Controller-->>Frontend: 204 No Content
    end
    
    Identity->>DB: Validate reset token
    alt Token invalid or expired
        Identity-->>Service: ValidationException
        Service-->>Controller: ValidationException
        Controller-->>Frontend: 400 Bad Request
    end
    
    Identity->>Identity: Hash new password
    Identity->>DB: Update user password
    Identity->>DB: Delete reset token
    Identity->>DB: Invalidate existing refresh tokens
    Identity->>DB: SaveChanges()
    
    Identity-->>Service: Success
    Service-->>Controller: Success
    Controller-->>Frontend: 204 No Content
    
    Frontend-->>User: ✓ Password reset!<br/>Redirect to login
```

### Process Steps
1. User initiates forgot password from frontend
2. User submits email address
3. Service rate-limits to prevent abuse
4. Database queried for user (but response is always generic)
5. If user exists: generate time-limited reset token
6. Send email with reset link containing token
7. Generic success response (prevents email enumeration)
8. User receives email and clicks reset link
9. Frontend shows password reset form
10. User enters new password
11. Service validates reset token
12. If valid: hash new password
13. Update user record with new password
14. Invalidate all existing refresh tokens (force logout everywhere)
15. Delete reset token record
16. Success response sent to frontend

---

## Change Password Flow

```mermaid
sequenceDiagram
    participant User as User/Client
    participant Controller as AuthController
    participant Service as AuthService
    participant Identity as IIdentityService
    participant DB as AppDbContext
    
    User->>Frontend: Settings > Change Password
    Frontend->>Frontend: Show form (current + new password)
    User->>Frontend: Enter passwords
    Frontend->>Controller: POST /api/auth/change-password<br/>ChangePasswordDto<br/>(with Authorization header)
    
    Controller->>Controller: Extract userId from JWT
    alt No authorization
        Controller-->>Frontend: 401 Unauthorized
    end
    
    Controller->>Service: ChangePasswordAsync(userId, dto)
    Service->>Identity: ChangePasswordAsync(userId, dto)
    
    Identity->>DB: Query user by userId
    alt User not found
        Identity-->>Service: NotFoundException
        Service-->>Controller: NotFoundException
        Controller-->>Frontend: 404 Not Found
    end
    
    Identity->>Identity: Hash provided current password
    Identity->>Identity: Compare with stored hash
    alt Current password incorrect
        Identity-->>Service: ValidationException
        Service-->>Controller: ValidationException
        Controller-->>Frontend: 400 Bad Request
    end
    
    Identity->>Identity: Validate new password strength
    alt Password too weak
        Identity-->>Service: ValidationException
        Service-->>Controller: ValidationException
        Controller-->>Frontend: 400 Bad Request
    end
    
    Identity->>Identity: Hash new password
    Identity->>DB: Update user password
    Identity->>DB: Invalidate refresh tokens
    Identity->>DB: SaveChanges()
    
    Identity-->>Service: Success
    Service-->>Controller: Success
    Controller-->>Frontend: 204 No Content
    
    Frontend-->>User: ✓ Password changed!<br/>May need to login again
```

### Process Steps
1. User navigates to password change form
2. User enters current and new password
3. Frontend sends request with Authorization header
4. Controller validates JWT and extracts userId
5. Service validates user exists
6. Current password verified via hash comparison
7. New password validated against strength requirements
8. New password hashed using secure algorithm
9. User record updated with new password
10. All existing refresh tokens invalidated (force logout everywhere)
11. Success response sent
12. User may need to re-authenticate to continue
