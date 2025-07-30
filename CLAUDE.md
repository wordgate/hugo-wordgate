# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo module that provides WordGate e-commerce and membership functionality for Hugo static sites. WordGate is a Chinese e-commerce platform integration that enables shopping cart, user authentication, payment processing, and order management features.

## Development Commands

### Hugo Module Commands
- `hugo mod init github.com/wordgate/hugo-wordgate` - Initialize Hugo module
- `hugo mod get -u` - Update module dependencies
- `hugo mod clean` - Clean module cache
- `hugo server` - Run Hugo development server
- `hugo build` - Build static site

### Git Publishing
- `git tag v1.0.0` - Create version tag
- `git push --tags` - Push tags to remote

## Architecture Overview

### Module Structure
- **assets/**: Static assets (CSS, JavaScript libraries)
  - `css/`: Pure CSS framework and custom WordGate styles
  - `js/`: Alpine.js, QR code library, and WordGate SDK
- **layouts/**: Hugo templates and components
  - `_default/`: Default page layouts for WordGate pages
  - `partials/`: Reusable template components
  - `shortcodes/`: Hugo shortcodes for embedding WordGate functionality
- **content/wordgate/**: Pre-built content pages for user flows
- **config.yaml**: Module configuration with Hugo version requirements

### Key Components

#### WordGate SDK (`assets/js/wordgate.sdk.js`)
Core JavaScript client providing:
- API communication with WordGate services
- Shopping cart management with event listeners
- User authentication (login/logout/registration)
- Address management and selection
- Payment processing integration

#### Authentication System
- Password-based and email verification code login
- OAuth integration support (Google, GitHub, etc.)
- JWT token management with local storage
- Session validation and automatic logout

#### Shopping Cart
- Add-to-cart functionality with product variants
- Quantity management and price calculations
- Address requirement detection
- Real-time cart updates with Alpine.js reactivity

#### Payment Integration
- Multiple payment methods support
- Order creation and tracking
- Payment result handling
- TronPay cryptocurrency payments

### Template System

#### Shortcodes
- `wordgate-login`: Login form with tabs (password/verification code)
- `wordgate-register`: User registration form
- `wordgate-cart-list`: Shopping cart display and checkout
- `wordgate-cart-add-btn`: Add to cart button component
- `wordgate-pay`: Payment processing interface
- `wordgate-user-*`: User profile and account management

#### Layouts
- Uses Pure CSS framework for responsive design
- Alpine.js for interactive functionality
- Partials for modular header/footer integration

### Configuration

#### Site Integration
Sites using this module must configure:
```yaml
wordgate:
  app_secret: "secret-key"
  app:
    name: "Site Name"
    currency: "CNY"
  config:
    smtp: # Email configuration
    security:
      code_expire: 600
    payment:
      enabled: true

params:
  wordgate:
    base_url: "https://api.wordgate.io"
    app_code: "app-code"
    enable_payment: true
```

#### Module Requirements
- Hugo v0.111.0+ (required for resource injection)
- Modern browsers with HTML5 support
- Alpine.js and Pure CSS (automatically injected)

### Internationalization
- Chinese language support with fallback text
- i18n keys for all user-facing text
- Configurable via Hugo's i18n system

### Security Considerations
- JWT tokens stored in localStorage
- CSRF protection via state parameters
- Input validation on all forms
- Secure OAuth callback handling

## Development Notes

### Testing Integration
No specific test framework is configured. Test by:
1. Creating a test Hugo site
2. Importing the module
3. Testing shortcodes and functionality manually
4. Verifying payment flows in sandbox mode

### Debugging
- Use browser dev tools to monitor WordGate SDK API calls
- Check localStorage for authentication tokens
- Monitor Alpine.js component state in Vue DevTools extension

### Common Issues
- Module loading: Run `hugo mod clean && hugo mod get -u`
- Template conflicts: Ensure no local templates override module templates
- Authentication: Verify WordGate API configuration and network connectivity