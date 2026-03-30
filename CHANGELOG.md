# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-3-30

### Added

- **Official V1 Release!** ShadowSelf is now fully out of Beta.
- Full cryptocurrency payment gateway for complete anonymity during checkout.
- Subscription Freezing capability with a grace period for inactive users.
- Tor hidden service support for maximum privacy when accessing the platform.
- Comprehensive API documentation specifically formatted for LLMs and automated agents (`AGENT.md`).
- Dedicated email viewer tab for better inbox management.
- Downloadable crypto invoices for offline record-keeping.

### Changed

- Completely redesigned the Identity Dashboard for a smoother, faster user experience.
- Upgraded email parsing engine for accurate threading and better attachment handling.
- Shifted to local font providers to prevent third-party tracking from Google Fonts.
- Upgraded legal documents (Privacy Policy, Terms) to be strictly privacy-first.
- Overhauled backend infrastructure and caching/throttling systems for lightning-fast API responses.
- Improved UX in the Email, Phone, and Identity configuration sections.

## [0.9.9] - 2026-2-23

### Added

- **Complete Crypto Suite**: Every identity now includes a fully functional, non-custodial crypto wallet.
- Support for swapping, sweeping, sending, and receiving multiple cryptocurrencies.
- Full support for Monero (XMR), including secure spend key management.
- Real-time polling for crypto market prices, network fees, and portfolio tracking.
- Global wealth estimator tracking funds across all your generated identities.
- Secure "Backup Private Key" feature and one-click CSV export for all identity data.

### Changed

- Shifted global dashboard to calculate total wealth instead of just displaying raw addresses.
- Strengthened local encryption for Monero keys before network transmission.
- Reduced crypto payment processing fees to 20% and disabled invasive AML tracking on traditional payments.

## [0.9.7] - 2026-1-3

### Added

- **Local Master Password**: Secure your identity data locally—we cannot see or recover it.
- Integrated Gemini 2.5 Flash model for hyper-realistic AI avatar generation.
- Official Tor (`.onion`) links and Mastodon verification instances added to the platform.

### Changed

- Upgraded core cryptographic functions for maximum data security.
- Enhanced prompt engineering for flawless profile pictures.
- Fortified platform security against CSRF and injection vulnerabilities.

### Removed

- Traditional Credit Card payments completely removed to focus exclusively on privacy-preserving transactions.
- Deprecated legacy Stable Diffusion generation models.

## [0.9.4] - 2025-7-17

### Added

- Browser Extension upgraded to version `1.1.0` with fallback avatars for empty states.
- Expanded self-hosting and infrastructure tools for enterprise deployments (automated container updates).
- Integrated secure Initialization Vectors (IV) for military-grade data encryption.

### Changed

- Fixed Firefox extension proxy connection protocols for better stability.
- Transitioned avatar AI to strictly "Realistic" styles for better operational security.
- Resolved TLS handshake issues for Chromium-based extension users.

### Removed

- Deprecated Dante SOCKS5 protocol due to security concerns.

## [0.9.0] - 2025-5-16

### Added

- **Advanced User-Agent Spoofing**: Automatically changes OS profile based on current device to blend into network traffic.
- **Actual Network Kill-Switch**: Drops all traffic if the proxy disconnects, preventing IP leaks.
- Complete Dockerization of the application and proxy networks for easy self-hosting.
- Direct installation links for Chrome and Firefox extensions.

### Changed

- Restructured database architecture for strict role-based access control.
- User-Agent strings are now spooled dynamically and are _never_ stored on our backend.
- Revised legal policies to strictly adhere to proactive GDPR compliance.

## [0.8.6] - 2025-5-03

### Added

- **Private Proxy Network**: Dedicated Squid proxy infrastructure with secure authentication.
- OpenVPN configuration support for device-wide routing.
- Automated generation of temporary, secure credentials for the proxy extension.
- "Incognito Mode" compatibility checks for browser extensions.

### Changed

- Streamlined the proxy authentication flow for browsers and improved native error notifications.

## [0.8.3] - 2025-4-27

### Added

- New unified Dashboard interface for managing multiple identities with search functionality.
- Proxy interface and User-Agent manager integrated directly into the browser extension.
- Localized country flags (removing third-party API tracking).

### Changed

- ShadowSelf is now open-source under the strictly copyleft **AGPL-v3 license**.
- Upgraded cryptographic engine to use secure `randomBytes()` exclusively.

## [0.8.0] - 2025-4-23

### Added

- **ShadowSelf Beta Release!**
- First iteration of the official Browser Extension for on-the-fly identity injection.
- Advanced CSRF protection across all forms and API endpoints.
- Dynamic caching system to dramatically decrease page load times.
- "Floating Avatars" visual component on the landing page.

### Changed

- Fully migrated to TailwindCSS v4 for a lighter, faster frontend footprint.

## [0.7.0] - 2025-4-14

### Added

- "Save and Continue" functionality for the identity creation wizard.
- Secure payment memorization and 3D Secure verification support.

### Changed

- Overhauled the Stripe checkout flow for better reliability without recreating customer IDs.

## [0.6.7] - 2025-4-09

### Added

- **Developer Documentation Hub**: Interactive API endpoints with syntax highlighting.
- **Burn Identity**: Feature to permanently delete an identity and securely wipe its data.
- Self-serve subscription cancellation dashboard.

### Changed

- Transitioned core communication from WebSockets to a highly stable REST API architecture.
- Added API Key authentication middleware for developers.

## [0.6.3] - 2025-3-28

### Added

- **Live SMS Dashboard**: Send, receive, and reply to SMS messages via your synthetic phone numbers.
- Full conversation thread views and the ability to permanently delete individual text messages.
- "Hover to Copy" buttons for lightning-fast credential grabbing.
- Cryptographic signature verification for incoming Twilio webhooks to prevent spoofing.

## [0.6.0] - 2025-3-21

### Added

- Built-in TOTP (2FA) Code Generator for securing identity-linked online accounts.
- Email forwarding capabilities and "Save as Draft" functionality for outgoing emails.
- Image lazy-loading for better bandwidth preservation.

## [0.5.7] - 2025-3-9

### Added

- **Full Outbound Email Support**: Compose, reply, and manage attachments via a rich-text editor (Quill.js).
- Complete mailbox structuring (Inbox, Sent, Drafts, Junk) with auto-wipe functionality.
- Live WebSocket listeners to instantly notify you of incoming emails.
- Client-side email sanitization (DOMPurify) to strip out tracking pixels and malicious scripts.

## [0.5.3] - 2025-3-8

### Added

- **Encrypted Vault**: Store passwords and TOTP secrets encrypted client-side via your Master Password.
- Built-in secure password generator.
- Intelligent image processing (Sharp.js) to resize avatars on the fly, saving data.
- General Information editing suite for customizing identity attributes.

## [0.5.0] - 2025-3-1

### Added

- **ShadowSelf Alpha Version Release!**
- Functioning Dashboard to track and manage generated identities.
- "General Information" summary tabs and beautiful empty-state illustrations for unconfigured sections.

### Changed

- Upgraded the identity creation wizard with beautiful transitions and iconography.
- Transitioned password hashing to bcryptJS for enhanced security.

## [0.4.5] - 2025-2-21

### Added

- Active status monitoring for live identities.
- Step-by-step onboarding process: Extension syncing, Ublock Origin setup, and Canvas Blocker recommendations.
- Twilio integration natively baked into the identity creation wizard.
- Full mobile responsiveness across the entire Identity Creation wizard.

## [0.4.0] - 2025-2-12

### Added

- Automated subscription cancellation and auto-refund system.
- Secure user Billing Portal via Stripe integration.
- Integrated Stability AI and FakerJS for dynamic, hyper-realistic identity generation.
- Secure WebSocket communication tunnel established between client and server during identity generation.

### Changed

- Rewrote pricing and feature matrices to be clearer and fully transparent.

## [0.3.8] - 2025-1-10

### Added

- Stripe payment processor integration for secure checkout sessions.
- Mandatory email verification system to prevent bot abuse.
- Beautifully designed HTML email templates for verifications and password resets.
- Ability to regenerate emergency recovery codes via the dashboard.

## [0.3.4] - 2024-12-12

### Added

- Foundational scaffolding and routing for the user Settings dashboard.
- Global modular components: Interactive Modals, Confirm Dialogs, and advanced Input fields.
- Server-side actions implemented to significantly reduce client-side payload.

## [0.3.0] - 2024-12-8

### Added

- First iteration of the User Dashboard interface.
- Global Search, Filtering, and Sorting tools for managing large sets of identities.
- Strict HTTP status code routing across all backend endpoints.

### Changed

- Emergency recovery codes are now automatically burned (deleted) immediately after use.
- Overhauled the Refund Policy for better user protection.

## [0.2.8] - 2024-11-28

### Added

- Complete user Login, Authentication, and Session management routing.
- **Two-Factor Authentication (2FA)** support and emergency Recovery Code generation.
- Multi-step architectural layout and copy functionalities integrated into the signup flow.

## [0.2.4] - 2024-11-22

### Added

- Secure logout routing and session destruction protocols.
- JWT (JSON Web Token) handling via strict `HttpOnly` cookies.
- Bearer token header injection for authenticated API requests.

### Changed

- Migrated registration validation to secure server-side actions.

## [0.2.0] - 2024-11-14

### Added

- Toast notification system for application-wide alerts.
- High-entropy password hashing and salting functions.
- Working Contact Form with automated email dispatching.
- Completed all Legal, Support, and FAQ pages.

## [0.1.5] - 2024-11-09

### Added

- Strict Privacy Policy detailing our zero-knowledge architecture.
- Detailed "About" page outlining the project's philosophy on privacy.
- Initial drafts of the Terms of Service and Refund Policy.

## [0.1.0] - 2024-11-03

### Added

- **ShadowSelf Waitlist Launched!**
- Complete migration to the Svelte 5 framework for unparalleled frontend performance.
- Search Engine Optimization: Implemented `sitemap.xml` and `robots.txt`.
- Integrated NanoCSS for lightweight, semantic default styling.

## [0.0.9] - 2024-10-29

### Added

- Deployed advanced NGINX configurations with robust firewall security measures.
- Successfully migrated to the production `shadowself` domain and bare-metal servers.
- Introduced vibrant gradient styles, card components, and scroll animations to modernise the UI.

## [0.0.7] - 2024-10-22

### Added

- Introduced the core "Benefits" and "Capabilities" sections to outline the necessity of synthetic identities.
- Immersive "Tracing Beam" and "Hideout" background patterns added to the landing page.
- High-resolution mockup visuals of the Identity Dashboard integrated.

## [0.0.5] - 2024-10-15

### Added

- Visual feature-grid layout and transparent "Pricing Model" breakdown introduced.
- Built-in graceful degradation ensuring the landing page functions for users with JavaScript disabled.
- Smooth visual transitions programmed between homepage sections.

## [0.0.3] - 2024-10-09

### Added

- Database connections successfully established (Postgres), enabling waitlist registration.
- Custom `404 Not Found` page and cybernetic "Circuit Board" visual pattern integrated.
- Official SimpleX chat community established for private user communication.

## [0.0.1] - 2024-10-03

### Added

- Initial project commit.
- Defined the project under the Open Source GPL-v3 license.
- Core routing components implemented (Header, Footer, Application Layout).
- Configured vital meta-tags for web indexing and sharing.
