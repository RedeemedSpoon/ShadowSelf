# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.00] - 2025-2-25

### Added

- Alpha version release
- Update website from waitlist to alpha
- New account table to database
- New identity routes in elysiaJS
- Temporary API/Extension route on elysiaJS
- New individual page for each of youridentity
- Add more column to identities table on database
- Dashboard actually retrieve your identities instead
- New coming soon page to api docs and extension
- New temporary text to individual identity pages
- Add system design to project
- New icons to the project

### Changed

- Update packages
- Change some route's path
- Change bcrypt to bcryptJS
- Change available location for last time
- Change waitlist to alpha version instead
- Creation process is have icons and better design
- Move redirect for sveltekit hooks to nginx instead
- Move location variable to a request on extension instead
- InputWithIcon now can hold value as prop and has a different color
- Temporary image and text to sync/extension on creation process
- Disable some stuff waiting for the full release

## [0.4.07] - 2025-2-21

### Added

- Add active status to identity
- Add finish process to creation (step 10)
- Add email creation shell command
- Add phone provision function

### Changed

- Fix types
- Move origin to connection.ts
- Change check identity function
- Change identity database structure
- Rename code switch case to location

## [0.4.06] - 2025-2-19

### Added

- Add twilio to the creation process
- Add phone registration to the creation process (step 4)
- Add scrollability to SelectionMenu

## [0.4.05] - 2025-2-17

### Added

- Add responsive design to creation process

### Changed

- Change ExtensionLinks to have better color
- Change identities location
- Fix wrong var use in email check
- Change transition in creation process to slide

## [0.4.04] - 2025-2-15

### Added

- Add new icons
- Add redo name & bio button
- Add ExtensionLinks component
- Add extension download process (step 6)
- Add extension syncing process (step 7)
- Add ublock origin recommendation process (step 8)
- Add canvas block recommendation process (step 9)
- Add final confirmal process (step 10)
- Add ping/pong mechanism to websocket

### Changed

- Change email checking to include unicode & exclude dots
- Change design to most all the creation process

## [0.4.03] - 2025-2-12

### Added

- Add new icons
- Add stability AI and fakerjs to creation process
- Add checks to the creation process
- Add location choice process (step 1)
- Add identity customization process (step 2)
- Add email creation process (step 3)

### Changed

- Update all packages.json
- Change remote font from google to rsms
- Change type to better accurate ones in creation process
- Fix error displays in creation process

## [0.4.02] - 2025-2-7

### Added

- Add ContinuousProcess component
- Add error/retry message to creation process
- Add design & markup to creation process
- Add switch statement and logic to the process
- Add alternative loader

### Changed

- Change pricing/features text to be more clear and specific
- Change first interaction in the creation process to regular HTTP request
- Change routes in the initial creation process
- Change database active column to status column

### Removed

- Remove stripe sending websocket message to client via WSConnections
- Remove all crypto payment/wallet promises

## [0.4.01] - 2025-2-1

### Added

- Add new route /create
- Add new elysiaJS router for the identity creation process
- Add new nginx websocket redirect reverse proxy
- Add secure websocket communication between client & server
- Add new column to identity table

### Changed

- Fixed some typo in name function
- Change $EMAIL_SALT to $SECRET_SAUCE
- Change tmux.sh to launch stripe instead of ssh, also onefetch

## [0.4.00] - 2025-1-23

### Added

- Add identities table in database
- Add cancelation & auto refund system
- Add purchase page markup & full design
- Add payment method to settings when not registered yet
- Add stripe portal page to settings when user has payment method
- Add delete stripe customer and change stripe customer email
- Add external link icon

### Changed

- Change customer backend billing paths
- Change email salt from $JWT_SECRET to $EMAIL_SALT
- Fix modal markup not showing black background overlay
- Change price id from fixed value to env variable
- Move email function in backend to email.ts
- Update faq answer & refund policy
- Update packages

## [0.3.10] - 2025-1-14

### Added

- Add prefill when customer is already existing (partial fail)
- Add design to payment form using stripe element
- Add payment to signup

## [0.3.09] - 2025-1-10

### Added

- Add a different reset email template
- Add rewind to generate new recovery codes in dashboard
- Add a pretty email verification template
- Add filled icons switch to some

### Changed

- Move changePricingModel to their respective places instead of $lib
- Settings icon are now filled
- Change purchase page design
- Modify faq question

## [0.3.08] - 2025-1-06

### Added

- Add Complete Email Process
- Add Email as a signup requirement
- Add forgot password on login
- Add Email verification
- Add Email to settings
- Add Tooltip component

## [0.3.07] - 2024-12-22

### Added

- Add stripe as payment processor
- Add stripe keys and prices
- Add billing backend route
- Add checkout session
- Add purchase page

## [0.3.06] - 2024-12-12

### Added

- Add responsiveness to settings page
- Add new tailwind classes
- Add server actions

### Changed

- Change setting page design
- Change $fetch store

## [0.3.05] - 2024-12-11

### Added

- New InputWithButton component
- New Confirm component
- New Modal component
- New Icons

### Changed

- Rename components
- Move sendForm to $lib
- Change Settings page design

## [0.3.04] - 2024-12-9

### Added

- Add setting page (not functional yet)
- Add temporary setting page Route
- Add type to app.d.ts

## [0.3.03] - 2024-12-8

### Added

- Add a new row to purchase an identity
- Add an interface when dashboard is empty
- Add redirect when logged in/out
- Add worldmap pattern

### Changed

- Change header when logged in to show settings

## [0.3.02] - 2024-12-6

### Added

- Add search functionality
- Add filter/sort functionality
- Add storing of filtering dashboard table
- Add new icons to $icon

## Changed

- Modify dashboard-table responsiveness
- Change table columns

## [0.3.01] - 2024-12-4

### Added

- Add dashboard page
- Add more icons to $icon
- Add SearchInput component
- Add empty dashboard interface

### Changed

- Used recovery code get deleted automatically
- Change buttons component

## [0.3.00] - 2024-12-1

### Added

- Add correct status code to backend

### Changed

- Change refund policy
- Change form submit to keep data
- Change name check to allow unicode
- Correct typescript errors

## [0.2.09] - 2024-11-28

### Added

- Add correct full login process
- Add complete login UI and routes
- Add remove and generate recovery tokens
- Add forgot password fix

## [0.2.08] - 2024-11-26

### Added

- Add style to signup
- Add Input component
- Add ReactiveButton component
- Add waiting animation to signup
- Add pretty create animation to signup

## [0.2.07] - 2024-11-24

- Add Step component
- Add StepItem component
- Add optional field to check function
- Add copy/download function to signup
- Add back control button to signup
- Add signup text content

### Changed

- Fix reactivity issue with signup derived variables
- Fix lifecycle issue with signup when error occurs
- Rename backup to recovery & code to token
- Change icons component function to $icon
- Change index.ts dom function to $dom
- Change error page text and style
- Change contact page form

## [0.2.06] - 2024-11-22

### Added

- Add signup server actions

### Changed

- Move cryptographic function from utils.ts to crypto.ts
- Move repetitive code into functions

## [0.2.05] - 2024-11-19

### Added

- Add two factor authentication
- Add recovery code

### Changed

- Change signup to a step by step process
- Change signup backend to be more divided

## [0.2.04] - 2024-11-17

### Added

- Add login route
- Add logout route

### Changed

- Fix reactivity issues with authentication
- Change Layout component

## [0.2.03] - 2024-11-15

### Added

- Add token & user stores
- Add cookies authentication
- Add header authentication bearer
- Add jwt onbefore handler
- Add layout.server.ts

## [0.2.02] - 2024-11-14

### Added

- Add notification to sign up form
- Add cookies to web application

### Changed

- Move all check to a single function
- Move check function to new file
- Modify database structure

## [0.2.01] - 2024-11-13

### Added

- Add register route
- Add password hash+salt function
- Add jwt library

## [0.2.00] - 2024-11-10

### Added

- Finished legal and support pages
- Add working contact form
- Add ability to send email

### Changed

- Moved custom tailwind class to tailwind.config.js

## [0.1.07] - 2024-11-09

### Added

- Add contact page
- Add SelectMenu component
- Add FAQ answer

### Changed

- Change homepage responsiveness

## [0.1.06] - 2024-11-08

### Added

- Add FAQ page
- Add about page

### Changed

- Change design of legal pages

## [0.1.05] - 2024-11-06

### Added

- Add term of service
- Add refund policy

## [0.1.04] - 2024-11-05

### Added

- Add privacy policy page
- Add boilerplate for other pages

### Changed

- Fixed minor bugs and such

## [0.1.03] - 2024-11-03

### Changed

- Fixed homepage height issues
- Fixed homepage phone responsiveness

## [0.1.02] - 2024-11-02

### Added

- Add sitemap.xml
- Add robots.xml

### Changed

- Fix bad page responsiveness
- Fix sections overlap

## [0.1.01] - 2024-11-01

### Added

- Add nanocss to the project
- Add lazy loading

### Changed

- Change image format and size
- Change to better semantic style
- Change styling a bit

## [0.1.00] - 2024-10-31

### Added

- Launch the website in waitlist mode
- Add responsiveness to website

### Changed

- Migrate to svelte 5
- Rewrote README.md and run locally section

## [0.0.20] - 2024-10-29

### Added

- New nginx config
- Add firewall & security measures
- Bought a domain for shadowself
- Bought a production server

### Changed

- Change db env variables
- tmux.sh also connect to production server

## [0.0.19] - 2024-10-27

### Added

- Add observer animation
- New Types

### Changed

- Move tab scroll event to a util function
- Move animation function to a util function

## [0.0.18] - 2024-10-25

### Added

- Add card component

### Changed

- Change text gradients
- Change card gradient
- Change styles to be more colorful

## [0.0.17] - 2024-10-22

### Changed

- Change product/reflection section titles
- Change minor styles

### Removed

- Remove hideout svg

## [0.0.16] - 2024-10-21

### Added

- New benefits sections
- New grid background component

### Changed

- Change structure a bit
- Change the text to be more coherent

## [0.0.15] - 2024-10-20

### Added

- Add tracing beam to Capabilities section
- Add background grid component
- Add hideout pattern

## [0.0.14] - 2024-10-19

### Changed

- Change Pricing section
- Made Reflection section more colorful
- Change to a much better slogan section

## [0.0.13] - 2024-10-15

### Added

- Add Capabilities section
- Add tab event to scroll sections
- Add question to pricing section

## [0.0.12] - 2024-10-14

### Added

- Add products section on homepage
- Add dashboard image

### Changed

- Change pricing section style

## [0.0.11] - 2024-10-13

### Added

- Add feature layout on homepage
- Add icons on homepage

### Changed

- Destructure homepage into some external components
- Change frontend structure

## [0.0.10] - 2024-10-11

### Added

- Add pricing section on homepage
- Add pricing model

### Changed

- Change home section text
- Change icon images to components
- Change slogan to another components
- Made buttons have gradients

## [0.0.09] - 2024-10-10

### Added

- Add no script client support
- Add reflection section on homepage
- Create highlight and underline effect on homepage

### Changed

- Optimize images size for performance

## [0.0.08] - 2024-10-09

### Added

- Add transition on the homepage sections

### Changed

- Change message on duplicate and join
- Darken background on even sections in homepage

## [0.0.07] - 2024-10-08

### Added

- Make 404 page
- Add cheveron icon
- Add slogan section
- Add circuit board pattern

### Changed

- Change home section text
- Disable links until it's ready

### Removed

- Remove sparkle component

## [0.0.06] - 2024-10-07

### Added

- Create tmux session config for development
- Made simplex community

### Changed

- Change environment variables name for db
- Move some style to 'app.css'
- Implement some css-inline styles

### Removed

- Remove session community

## [0.0.05] - 2024-10-06

### Added

- Add ability to register to waitlist
- Connect backend to database (postgres.js)

### Changed

- Move validation to server-side
- Move database name and username to an environment variable
- Fix small mistakes in frontend

## [0.0.04] - 2024-10-03

### Added

- Add notification component
- Add info/success/error icons
- Add svelte alias for ease of use
- Add stores.ts for stores
- Add types.ts for types

### Changed

- Destructure index.ts into multiple files
- Change header transition on homepage
- Refactor code

### Removed

- Remove svelte contextAPI in favor of stores

## [0.0.03] - 2024-10-02

### Added

- Create header component
- Create footer component
- Create layout component
- Add Icons : GitHub, Session, Tor

## Changed

- Header logo has text beside it instead of under it
- App.css has global styles

## [0.0.02] - 2024-10-01

### Added

- Add meta-tags to the head
- Support for 'prettier' for formatting code

### Changed

- Change font to 'Inter'
- Modify logo & favicon
- Restructure the 'static' directory

## [0.0.01] - 2024-9-30

### Added

- Initial start
- Add favicon
- Add GPL-v3 license
- Add README.md
- Add support for bun
- Add support for tailwindcss
- Add configuration files to suit my needs
