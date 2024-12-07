# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.02] - 2024-12-6

### Added

- Add search functionality
- Add filter/sort functionality
- Add new icons

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

- Move crytographic function from utils.ts to crypto.ts
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
