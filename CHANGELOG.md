# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.5] - 2025-7-17

### Added

- Basic test script
- Query database script
- Discord warnings script
- Extension packing script
- Pull certificates script
- Docker backend bind mount for adding linux users
- Lets-encrypt docker

### Changed

- Rename old scripts
- Improved script environment variables integration
- Echo statement with now some emojis
- Restructure docs content paths
- Shortened docs example code
- Change discord invite link
- Latino ethnicity to slav

## [0.9.4] - 2025-7-6

### Added

- Extension 1.1.0 version
- Backup database script
- Secure IV for encryption
- Kill switch exception for shadowself.io
- Bind mount for docker instead of volumes

### Changed

- Update packages
- Extension versions
- Fix firefox proxy connection method/protocol
- replace error() deprecated function
- Error handling layout.server.ts
- Documentation svelte code
- Fix maintenance script
- Edge extension link

### Removed

- Dante SOCKS5 support (unsecure)

## [0.9.3] - 2025-5-30

### Added

- Update to final README.md
- Dante back to support SOCK5 in firfox and API
- update.sh to automatically update docker container globally
- User icon when no identities in extension page

### Changed

- Extension TLS issues is chromium
- Change to Realistic prompts when generating avatars
- Fix signup/login transition design issues
- Move shell files into .scripts/
- Fix global design issues
- Fix paths issues
- Change ports

## [0.9.2] - 2025-5-14

### Added

- Docker environment variables
- Application docker compose
- Proxies docker compose

### Changed

- Divide Database into roles.sql and tables.sql
- Correct host to include docker container name
- Change database environment variable names
- Fix Docker issues

### Removed

- Nginx Caching
- Domains form cookie creation

## [0.9.1] - 2025-5-16

### Added

- .dockerignore files
- Proxy dockerfiles
- Frontend dockerfiles
- Backend dockerfiles
- Extension links/urls
- Database separate directory

### Changed

- Move core web server to application/ directory
- move extension background code to background/ directory
- Fix backend pre request code to better catch errors
- renew Legal policy page to be more pro-GDPR
- Docker container intern paths

## [0.9.0] - 2025-5-06

### Added

- New proxy icon
- Proxy documentation section
- Documentation list proxies addition
- Change OS based on device in user agent page
- Update icon based on proxy settings
- test Connection bandwidth speed
- Store and display user agent
- Spool user agent headers
- Actual kill switch

### Changed

- User agent will not be stored in the backend
- Divide background.js into proxy.js and user-agent.js

## [0.8.6] - 2025-5-03

### Added

- Squid conf file
- proxy web server
- Squid Authentication
- Proxies directory and related configurations
- Test connection after proxy authentication
- Add/Delete linux accounts for proxies
- Display browser error notifications
- New database columns
- Transition design

### Changed

- Move /api-extension to /api/proxy
- Move most background logic to functions
- Tmux listen for proxy web server
- Fix bearer lowercase bug

### Removed

- Dante and socks5
- Temporary credentials generation
- Backend extension.ts

## [0.8.5] - 2025-4-30

### Added

- Dante socks5 conf file
- Proxy authentication process
- OpenVPN configuration file
- Generate temporary credentials for extension (user/pass)
- Independent manifest.json for each firefox and chrome
- Incognito check before connecting to proxy
- Send and react to browser messages

### Changed

- Disable select menu after checkbox click
- Fix chrome authentication
- Improve API middleware

## [0.8.4] - 2025-4-27

### Added

- More icons
- Dashboard search functionality
- Local country flag instead of flagsapi.com
- Proxy user interface in the browser extension
- User-agent UI in the browser extension
- Custom checkbox and select menu

### Changed

- Change licence for GPL-v3 to AGPL-v3
- Update step 5 in creation process for better design
- Actual user interface instead of mockup image in the extension page
- Rework link to include params to ignore instead of using click event
- Extension download page image background
- Move most extension css to global.css

## [0.8.3] - 2025-4-25

### Added

- New /extension-api route
- Dashboard user interface and design
- Footer and icons in the browser extension
- Welcome user interface in the browser extension
- Dashbaoh both empty and full states

### Changed

- Move old backend route /extension-api to /locations
- Crypto uses randomBytes() instead of pseudoRandomBytes()
- Move all util and helper function to shared.js
- Fix phone number format on regular dashboard

### Removed

- Step 6 in creation process

## [0.8.2] - 2025-4-23

### Added

- Beta release
- Early work on browsers extension
- Extension main file and structure
- Global.css and HTML head (extensions)
- Extension manifest.json
- Extension icons

### Changed

- Move to tailwindcss v4
- Fix tailwind v4 migration issues
- Revert scrollhack to old ways (add text instead)
- Lowercase the root directories names
- Fix svelte LSP-recommended issues
- Add reduce motion on homepage

## [0.8.1] - 2025-4-21

### Added

- FloatingAvatars component
- Extension UI mockup image
- Extension page

### Changed

- Solution section on homepage right section
- Services section on homepage to use new images

### Removed

- Satisfaction image
- Services images

## [0.8.0] - 2025-4-19

### Added

- CSRF protection
- Sparkle component
- Dynamic nginx caching system
- Check to contact form

### Changed

- Rename homepage components
- Join section on homepage to be final
- Fix scrollhack on homepage

## [0.7.0] - 2025-4-14

### Added

- Payment memorization
- Confirmation and 3D secure payment
- Continue creation process in dashboard
- New mastodon account
- New discord server

### Changed

- Fix new stripe webhook
- Change checkout to backend regular payment
- Fix recreation of stripe customer each time

### Removed

- Stripe checkout
- SimpleX link
- Tor link

## [0.6.7] - 2025-4-09

### Added

- Highlight.js
- APICode component
- HTTPMethod component
- Full documentation page
- Documentation section selection
- Docs content directory and content
- Documentation page responsiveness
- Documentation anchor hash
- Quick test API route
- More icons
- More alias
- Docs types

### Changed

- Fix ESlint
- Fix SelectMenu
- Header settings icon
- Move format/fetch functions to other files
- Organize components in main into directories
- Move identity component to routes
- Organize icons into directories

## [0.6.6] - 2025-4-02

### Added

- Delete identities
- Cancel subscriptionw
- Check body in API request
- Query parameters in API

### Changed

- Correct HTTP verbs in API
- Change Prompts to have adequate environment
- Fix countless bugs
- Rename API keys

## [0.6.5] - 2025-3-28

### Added

- Middleware to avoid repeating code
- API middleware and API key authentication
- Implement URL fragments for easier navigation
- Responsive design to full identity page

### Changed

- Move API routes to individual files
- Rewrite whole websocket implementation to regular REST API
- Made code more readable and prettier
- Rename variables and functions
- Better types in frontend

## [0.6.4] - 2025-3-26

### Added

- Full phone section
- ComposeMessage component
- Frontend change when receiving new message
- Replying to messages
- Sending messages

### Changed

- Fix twilio webhooks issue
- Fix types and stores

### Removed

- MMS promise from phone section

## [0.6.3] - 2025-3-23

### Added

- Show full discussion
- Conversation on phone section
- Verify twilio signature
- Delete messages feature

### Changed

- Rename object keys in API and frontend
- Move svelte file to sub-components (identity page)
- Divide phone section into components
- Move some stores outside $stores
- Redo some types

## [0.6.2] - 2025-3-21

### Added

- $crypto.ts
- Phone section main UI
- HoverCopyButton component
- WSConnections (correctly implemented this time)
- Even more types

### Changed

- Divide general information section into components
- Divide online account section into components
- Online account section UI/TOTP
- Fix websocket close issue

## [0.6.1] - 2025-3-19

### Added

- Twilio messaging services
- Twilio CLI webhooks to tmux
- Route /phone/:id and related functions
- Webhooks.ts (move all webhooks routes there)
- More types

### Remove

- US option from country list due to A2P 10DLC

## [0.6.0] - 2025-3-16

### Added

- New icon
- CONTRIBUTING.md
- Saving as drafts
- Email forwarding
- Lazy loading to most images
- Editing and sending drafts
- Add To key/value pair to email
- Totp code generator on account section
- Auto maintenance script and cron jobs

### Changed

- Rename store and functions
- Fix cookie deletion on prod
- Fix email searching function
- Design and text for email section
- Clearing and update UI for email section
- Try catch statement for email parsing

## [0.5.8] - 2025-2-12

### Added

- More checks
- Sending emails/replies
- Decoding RFC822 email better and quote printable text
- Dynamic imap/smtp connection function
- Update design/text and loading buttons
- Show error to user

### Changed

- Fix vite inline svg
- Fix load issue on section change
- Update types

## [0.5.7] - 2025-2-10

### Added

- New icons
- Tooltip on ActionIcons
- Quill.js for writing emails
- Inbox/Sent/Drafts/Junk mailboxes
- Get/send email attachments and download them
- Divide Email.svelte into separate components
- Fetch replies recursively
- Auto-delete junk mailbox
- /webhook-twilio route
- Load more buttons

### Changed

- Better imap fetching functions
- Fix loader not working

## [0.5.6] - 2025-3-9

### Added

- /api/email route
- FetchEmail functions
- Websocket connection for email
- listening for new emails
- decode and parse email
- Display and sanitize email on client
- Imap-simple and DOMPurify libraries
- Imap-email.ts for imap protocol functions
- Empty inbox state and text

### Changed

- Update packages
- Move email.ts to smtp-email.ts
- Loader to accept bigger form

## [0.5.5] - 2025-3-8

### Added

- New icons
- /api/account route
- Empty states account section
- Encrypt/decrypt password/totp
- Online account section on identity page
- Local master password CRUD operations
- Generating/seeing passwords
- Adding/deleting/editing accounts

## [0.5.4] - 2025-3-4

### Added

- Prompt.ts and better diverse prompt
- Sharp.js to reseize profile picture

### Changed

- dashboard has lower resolution picture
- Design and types

## [0.5.3] - 2025-3-3

### Added

- New back button
- /api/identity route
- Websocket.ts backend
- New checkAPI function
- Functional edit section of identity
- General information edit button and part
- Format phone numbers and credit cards
- Copy/download profile picture image
- Websocket connection and ping/pong

### Changed

- Information section design
- Copy design change

## [0.5.2] - 2025-3-1

### Added

- New icons
- New svg background images
- FetchAPI function
- Empty state sections
- CopyButton component
- Boilerplate code to all sections
- General Information section to identity page
- ActionIcons to all different section

### Changed

- Rename old fetchApi to fetchBackend
- Move identity.ts to api.ts
- Creation process transition
- Profile picture prompt
- Database varchar length
- Overall design

### Removed

- Cancel icon
- Moneyjar icon

## [0.5.1] - 2025-2-27

### Added

- New icons
- ActionIcon component
- Identity individual page (barebone)
- Top button selector on identity page
- Identity error message
- Back button

### Changed

- Release Dates
- All lock file to .gitignore

## [0.5.0] - 2025-2-25

### Added

- Alpha version release
- New account table to database
- New identity routes in elysiaJS
- Temporary API/Extension route on elysiaJS
- New individual page for each identity
- More column to identities table on database
- Dashboard actually retrieve your identities instead
- New coming soon page to api docs and extension
- New temporary text to individual identity pages
- System design to project
- New icons to the project

### Changed

- Update packages
- Some route's path
- Bcrypt to bcryptJS
- Available location for last time
- Waitlist to alpha version instead
- Creation process is have icons and better design
- Move redirect for sveltekit hooks to nginx instead
- Move location variable to a request on extension instead
- InputWithIcon now can hold value as prop and has a different color
- Temporary image and text to sync/extension on creation process
- Disable some stuff waiting for the full release

## [0.4.7] - 2025-2-21

### Added

- Active status to identity
- Finish process to creation (step 10)
- Email creation shell command
- Phone provision function

### Changed

- Fix types
- Move origin to connection.ts
- Check identity function
- Identity database structure
- Rename code switch case to location

## [0.4.6] - 2025-2-19

### Added

- Twilio to the creation process
- Phone registration to the creation process (step 4)
- Scrollability to SelectionMenu

## [0.4.5] - 2025-2-17

### Added

- Responsive design to creation process

### Changed

- Identities location
- Fix wrong var use in email check
- ExtensionLinks to have better color
- Transition in creation process to slide

## [0.4.4] - 2025-2-15

### Added

- New icons
- Redo name & bio button
- ExtensionLinks component
- Extension download process (step 6)
- Extension syncing process (step 7)
- Ublock origin recommendation process (step 8)
- Canvas block recommendation process (step 9)
- Final confirmal process (step 10)
- Ping/pong mechanism to websocket

### Changed

- Email checking to include unicode & exclude dots
- Design to most all the creation process

## [0.4.3] - 2025-2-12

### Added

- New exiting icons
- Stability AI and fakerjs to creation process
- Checks to the creation process
- Location choice process (step 1)
- Identity customization process (step 2)
- Email creation process (step 3)

### Changed

- Update all packages.json
- Remote font from google to rsms
- Type to better accurate ones in creation process
- Fix error displays in creation process

## [0.4.2] - 2025-2-7

### Added

- ContinuousProcess component
- Error/retry message to creation process
- Design & markup to creation process
- Switch statement and logic to the process
- Alternative loader

### Changed

- Pricing/features text to be more clear and specific
- First interaction in the creation process to regular HTTP request
- Routes in the initial creation process
- Database active column to status column

### Removed

- Stripe sending websocket message to client via WSConnections
- All crypto payment/wallet promises

## [0.4.1] - 2025-2-1

### Added

- New route /create
- New elysiaJS router for the identity creation process
- New nginx websocket redirect reverse proxy
- Secure websocket communication between client & server
- New column to identity table

### Changed

- Fix some typo in name function
- $EMAIL_SALT to $SECRET_SAUCE
- Tmux.sh to launch stripe instead of ssh, also onefetch

## [0.4.0] - 2025-1-23

### Added

- Identities table in database
- Cancelation & auto refund system
- Purchase page markup & full design
- Payment method to settings when not registered yet
- Stripe portal page to settings when user has payment method
- Delete stripe customer and change stripe customer email
- External link icon

### Changed

- Customer backend billing paths
- Email salt from $JWT_SECRET to $EMAIL_SALT
- Fix modal markup not showing black background overlay
- Price id from fixed value to env variable
- Move email function in backend to email.ts
- Update faq answer & refund policy
- Update packages

## [0.3.9] - 2025-1-10

### Added

- A different reset email template
- A pretty email verification template
- Rewind to generate new recovery codes in dashboard
- Design to payment form using stripe element
- Fill icons switch to some
- Payment to signup

### Changed

- Move changePricingModel to their respective places instead of $lib
- Settings icon are now filled
- Purchase page design
- Modify faq question

## [0.3.8] - 2025-1-06

### Added

- Complete Email Process
- Email as a signup requirement
- Forgot password on login
- Email verification
- Email to settings
- Tooltip component

## [0.3.7] - 2024-12-22

### Added

- Stripe as payment processor
- Stripe keys and prices
- Billing backend route
- Checkout session
- Purchase page

## [0.3.6] - 2024-12-12

### Added

- Responsiveness to settings page
- New tailwind classes
- Server actions

### Changed

- Setting page design
- $fetching store

## [0.3.5] - 2024-12-11

### Added

- New InputWithButton component
- New Confirm component
- New Modal component
- New Icons

### Changed

- Rename components
- Move updateFetch to $lib
- Settings page design

## [0.3.4] - 2024-12-9

### Added

- Setting page (not functional yet)
- Temporary setting page Route
- Type to app.d.ts

## [0.3.3] - 2024-12-8

### Added

- A new row to purchase an identity
- An interface when dashboard is empty
- Redirect when logged in/out
- Worldmap pattern

### Changed

- Header when logged in to show settings

## [0.3.2] - 2024-12-6

### Added

- Search functionality
- Filter/sort functionality
- Storing of filtering dashboard table
- New icons to $icon

## Changed

- Modify dashboard-table responsiveness
- Table columns

## [0.3.1] - 2024-12-4

### Added

- Dashboard page
- More icons to $icon
- SearchInput component
- Empty dashboard interface

### Changed

- Used recovery code get deleted automatically
- Buttons component

## [0.3.0] - 2024-12-1

### Added

- Correct status code to backend

### Changed

- Refund policy
- Form submit to keep data
- Name check to allow unicode
- Correct typescript errors

## [0.2.9] - 2024-11-28

### Added

- Correct full login process
- Complete login UI and routes
- Generate recovery tokens
- Forgot password fix

## [0.2.8] - 2024-11-26

### Added

- Style to signup
- Input component
- ReactiveButton component
- Waiting animation to signup
- Pretty create animation to signup

## [0.2.7] - 2024-11-24

- Step component
- StepItem component
- Optional field to check function
- Copy/download function to signup
- Back control button to signup
- Signup text content

### Changed

- Fix reactivity issue with signup derived variables
- Fix lifecycle issue with signup when error occurs
- Rename backup to recovery & code to token
- Icons component function to $icon
- Index.ts dom function to $dom
- Error page text and style
- Contact page form

## [0.2.6] - 2024-11-22

### Added

- Signup server actions

### Changed

- Move cryptographic function from utils.ts to crypto.ts
- Move repetitive code into functions

## [0.2.5] - 2024-11-19

### Added

- Two factor authentication
- Recovery code

### Changed

- Signup to a step by step process
- Signup backend to be more divided

## [0.2.4] - 2024-11-17

### Added

- Login route
- Logout route

### Changed

- Fix reactivity issues with authentication
- Layout component

## [0.2.3] - 2024-11-15

### Added

- Token & user stores
- Cookies authentication
- Header authentication bearer
- JWT onbefore handler
- Layout.server.ts

## [0.2.2] - 2024-11-14

### Added

- Notification to sign up form
- Cookies to web application

### Changed

- Move all check to a single function
- Move check function to new file
- Modify database structure

## [0.2.1] - 2024-11-13

### Added

- Register route
- Password hash+salt function
- JWT library

## [0.2.0] - 2024-11-10

### Added

- Finish legal and support pages
- Working contact form
- Ability to send email

### Changed

- Move custom tailwind class to tailwind.config.js

## [0.1.7] - 2024-11-09

### Added

- Contact page
- SelectMenu component
- FAQ answers

### Changed

- Homepage responsiveness

## [0.1.6] - 2024-11-08

### Added

- FAQ page
- About page

### Changed

- Design of legal pages

## [0.1.5] - 2024-11-06

### Added

- Term of service
- Refund policy

## [0.1.4] - 2024-11-05

### Added

- Privacy policy page
- Boilerplate for other pages

### Changed

- Fixed minor bugs and such

## [0.1.3] - 2024-11-03

### Changed

- Fixed homepage height issues
- Fixed homepage phone responsiveness

## [0.1.2] - 2024-11-02

### Added

- Sitemap.xml
- Robots.xml

### Changed

- Fix bad page responsiveness
- Fix sections overlap

## [0.1.1] - 2024-11-01

### Added

- Nanocss to the project
- Lazy loading

### Changed

- Image format and size
- Better semantic style
- Styling a bit

## [0.1.0] - 2024-10-31

### Added

- Launch the website in waitlist mode
- Responsiveness to website

### Changed

- Migrate to svelte 5
- Rewrote README.md and run locally section

## [0.0.20] - 2024-10-29

### Added

- New nginx config
- Firewall & security measures
- Bought a domain for shadowself
- Bought a production server

### Changed

- DB env variables
- Tmux.sh also connect to production server

## [0.0.19] - 2024-10-27

### Added

- Observer animation
- New Types

### Changed

- Move tab scroll event to a util function
- Move animation function to a util function

## [0.0.18] - 2024-10-25

### Added

- Card component

### Changed

- Text gradients
- Card gradient
- Styles to be more colorful

## [0.0.17] - 2024-10-22

### Changed

- Product/reflection section titles
- Minor styles

### Removed

- Hideout svg

## [0.0.16] - 2024-10-21

### Added

- New benefits sections
- New grid background component

### Changed

- Restructure a bit
- The text to be more coherent

## [0.0.15] - 2024-10-20

### Added

- Tracing beam to Capabilities section
- Background grid component
- Hideout pattern

## [0.0.14] - 2024-10-19

### Changed

- Pricing section
- Made Reflection section more colorful
- Much better slogan section

## [0.0.13] - 2024-10-15

### Added

- Capabilities section
- Tab event to scroll sections
- Question to pricing section

## [0.0.12] - 2024-10-14

### Added

- Products section on homepage
- Dashboard image

### Changed

- Pricing section style

## [0.0.11] - 2024-10-13

### Added

- Feature layout on homepage
- Icons on homepage

### Changed

- Destructure homepage into some external components
- Frontend structure

## [0.0.10] - 2024-10-11

### Added

- Pricing section on homepage
- Pricing model

### Changed

- Home section text
- Icon images to components
- Slogan to another components
- Made buttons have gradients

## [0.0.9] - 2024-10-10

### Added

- No script client support
- Reflection section on homepage
- Create highlight and underline effect on homepage

### Changed

- Optimize images size for performance

## [0.0.8] - 2024-10-09

### Added

- Transition on the homepage sections

### Changed

- Message on duplicate and join
- Darken background on even sections in homepage

## [0.0.7] - 2024-10-08

### Added

- 404 page
- Cheveron icon
- Slogan section
- Circuit board pattern

### Changed

- Home section text
- Disable links until it's ready

### Removed

- Sparkle component

## [0.0.6] - 2024-10-07

### Added

- Create tmux session config for development
- Made simplex community

### Changed

- Environment variables name for db
- Implement some css-inline styles
- Move some style to app.css

### Removed

- Session community

## [0.0.5] - 2024-10-06

### Added

- Ability to register to waitlist
- Connect backend to database (postgres.js)

### Changed

- Move validation to server-side
- Move database name and username to an environment variable
- Fix small mistakes in frontend

## [0.0.4] - 2024-10-03

### Added

- Notification component
- Info/success/error icons
- Svelte alias for ease of use
- Stores.ts for stores
- Types.ts for types

### Changed

- Destructure index.ts into multiple files
- Header transition on homepage
- Refactor code

### Removed

- Svelte contextAPI in favor of stores

## [0.0.3] - 2024-10-02

### Added

- Header component
- Footer component
- Layout component
- Icons for GitHub, SimpleX and Tor

## Changed

- Header logo has text beside it instead of under it
- App.css has global styles

## [0.0.2] - 2024-10-01

### Added

- Meta-tags to the head
- Support for 'prettier' for formatting code

### Changed

- Font to Inter
- Modify logo & favicon
- Restructure the static directory

## [0.0.1] - 2024-9-30

### Added

- Initial start
- Favicon and logo
- GPL-v3 license
- Support for bun
- Support for tailwindcss
- Configuration files to suit my needs
