Mocha Madness Web Application

This document defines the instructions for Claude Code to build the Mocha Madness March Madness bracket challenge web application.

The goal is to build a lightweight, mobile-first bracket challenge platform optimized for simplicity, transparency, and ease of participation.

The application will be deployed on Netlify.

Project Overview

Mocha Madness is a private bracket challenge where users can:

create an account with passwordless login

pay to enter brackets

submit up to 3 brackets

track leaderboard standings

view tournament progress

The product should prioritize:

simple UX

low login friction

mobile usability

transparent scoring

Do NOT build a sportsbook or gambling system.

This is a friendly bracket competition.

Repository Structure

The repository will use the following structure.
Mocha_Madness/

Branding/
    mocha_madness_logo.png
    brand-guide.md

src/
    components/
    pages/
    services/
    styles/

public/
    assets/

netlify/
    functions/

README.md
instructions.md

The Branding folder contains the official logo and any design assets.

Use these assets wherever possible.

Branding Requirements

The Mocha Madness brand is inspired by a tortoiseshell cat named Mocha.

The design should feel:

warm

playful

premium

sports-themed

Primary brand colors:
Mocha Roast      #3B2A26
Court Orange     #E76F2F
Cream Foam       #F2E8DA
Caramel Drizzle  #C98B4A
Tortie Gold      #D7A45A

Typography:

Headlines
League Spartan

Body
Inter

The logo in Branding/mocha_madness_logo.png should be used in:

navbar

landing page hero

leaderboard header

Tech Stack

Use a modern lightweight stack compatible with Netlify.

Preferred stack:

Frontend

React

Vite

Styling

Tailwind CSS

Authentication

Supabase passwordless login

Database

Supabase Postgres

Payments

Stripe

Deployment

Netlify

Server logic

Netlify Functions

Core Features
1. Landing Page

Page: /

Landing page must include:

Hero section

Title

Mocha Madness

Subtitle

Pick your winners.
Track your bracket.
Win the pot.

CTA Buttons

Enter Your Bracket
View Leaderboard

Hero illustration space should allow a mascot illustration later.

Use the logo from:
Branding/mocha_madness_logo.png

2. Authentication

Use passwordless login via email magic link.

Requirements:

Users enter email
Magic link sent
User logged in

No passwords.

3. User Dashboard

Page: /dashboard

Dashboard includes:

My Brackets

Display bracket cards

Status:

Draft
Submitted
Locked

Buttons

Create Bracket
Edit Bracket
View Bracket

Leaderboard preview

Pot summary

Display:

Total brackets
Total pot
Projected payouts

4. Bracket Builder

Page: /bracket

Create a 64-team bracket interface.

Rounds:

Round of 64
Round of 32
Sweet 16
Elite 8
Final Four
Championship

User should:

click teams to advance them

Bracket must autosave.

Include tiebreaker field:

Championship total points prediction.

5. Bracket Limits

Rules:

Maximum 3 brackets per user.

Users must pay $20 per bracket.

Logic:

Bracket cannot be submitted unless payment is confirmed.

6. Payment Integration

Use Stripe Checkout.

Price per bracket:

$20

After payment success:

Create bracket entry linked to the user.

7. Leaderboard

Page: /leaderboard

Leaderboard table:

Rank
User
Points
Best Bracket

Highlight top 3.

Scoring Model

Default scoring:
Round of 64      1 point
Round of 32      2 points
Sweet 16         4 points
Elite 8          8 points
Final Four       16 points
Championship     32 points

Leaderboard sorts by:

highest score.

Use tiebreaker if tied.

Admin Features

Admin access should be limited to specific emails.

Admin dashboard allows:

view users
view payments
view brackets
update game winners
recalculate leaderboard

Tournament Data

Initial version should include placeholder teams.

Admin panel should allow:

editing team names
setting winners
triggering score recalculation

Do not build complex sports data integrations.

Mobile Requirements

The application must be mobile friendly.

Bracket UI should adapt for smaller screens by:

showing one round at a time.

UI Guidelines

Design should be:

clean
modern
card based
high contrast

Use rounded cards and subtle shadows.

Avoid clutter.

Error States

Include friendly error messages.

Example:

Bracket Locked

"The buzzer sounded. Picks are final."

Payment Required

"Complete payment to submit this bracket."

Deployment Instructions

The project should be deployable via Netlify.

Requirements:

Build command
npm run build

Publish directory
dist

Environment variables required:
SUPABASE_URL
SUPABASE_ANON_KEY
STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY

Build Order

Claude should implement the project in this order:

Project scaffolding

Landing page

Authentication

Dashboard

Bracket builder UI

Database schema

Payment flow

Leaderboard

Admin panel

Mobile polish

Out of Scope

Do NOT implement:

chat
sports betting features
advanced analytics
native mobile apps
real-time play-by-play

Success Criteria

The MVP is complete when:

Users can:

sign in
pay for brackets
create brackets
submit picks
view leaderboard

Admins can:

update winners
recalculate scores

The app successfully deploys on Netlify.

Important Instruction

Prioritize:

simplicity
clean architecture
maintainability

Do not over-engineer.

Build a working MVP first.
