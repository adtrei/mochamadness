Engineering Guidelines for Mocha Madness

This file provides guidance for Claude Code when working on the Mocha Madness repository.

Claude should treat this file as the engineering operating manual for the project.

Project Mission

Mocha Madness is a lightweight March Madness bracket challenge web app.

The goal is to provide a simple, friendly, low-friction bracket experience that avoids the complexity of ESPN, Yahoo, or CBS bracket platforms.

Users should be able to:

sign in quickly

pay for bracket entries

submit picks

track leaderboard standings

The product should feel:

clean

fast

mobile friendly

transparent

This is not a sportsbook and not a fantasy platform.

It is a simple private bracket challenge.

Development Philosophy

Claude should prioritize:

Simplicity over complexity

Readable code

Mobile-first UI

Fast iteration

Working MVP before polish

Avoid premature optimization.

Avoid unnecessary abstractions.

Core Product Principles
Low Friction

Users should be able to:

open the site

login with email

pay for bracket

make picks

In under 2 minutes.

Transparency

Users should always see:

leaderboard

scoring rules

pot size

payout structure

Fun Personality

The product mascot is Mocha, a tortoiseshell cat.

Copywriting can occasionally include light personality such as:

"Even Mocha didn't see that upset coming."

But do not overdo humor.

Technology Stack

Use the following stack unless explicitly instructed otherwise.

Frontend

React

Vite

TailwindCSS

Backend

Supabase

Authentication

Supabase passwordless magic link

Payments

Stripe Checkout

Hosting

Netlify

Server Logic

Netlify Functions

Code Organization

The project structure should follow this model.
Mocha\_Madness/

Branding/
mocha\_madness\_logo.png

src/
components/
pages/
services/
hooks/
utils/

public/
assets/

netlify/
functions/

Guidelines:

Components should be reusable.

Pages should contain minimal logic.

Business logic should live in:
services/

Naming Conventions

Use clear naming conventions.

Examples:
BracketBuilder.jsx
LeaderboardTable.jsx
UserDashboard.jsx
PaymentService.js
BracketService.js
ScoreCalculator.js

Avoid generic names like:
helper.js
stuff.js
logic.js

UI Design Rules

The UI should feel modern and minimal.

Design guidelines:

rounded cards

clear typography

generous whitespace

subtle shadows

Primary color palette:
Mocha Roast      #3B2A26
Court Orange     #E76F2F
Cream Foam       #F2E8DA
Caramel Drizzle  #C98B4A



Typography:

Headlines

League Spartan

Body

Inter

Bracket System

The bracket consists of:
Round of 64
Round of 32
Sweet 16
Elite 8
Final Four
Championship

Users pick winners for each game.

The bracket auto advances winners.

Users must submit picks before tournament lock time.

After lock:

Brackets become read-only.

Scoring Rules

Default scoring:
Round of 64      1 point
Round of 32      2 points
Sweet 16         4 points
Elite 8          8 points
Final Four       16 points
Championship     32 points

Leaderboard sorts by:
highest total score

Tiebreaker:
championship score prediction

Bracket Limits

Rules:
Maximum 3 brackets per user
Entry fee: $20 per bracket



Logic:



Users cannot submit a bracket unless payment is completed.



Payment Logic



Payments should use Stripe Checkout.



Flow:

User selects Create Bracket

→ redirect to Stripe Checkout

→ payment success

→ bracket slot unlocked



Avoid custom payment handling.



Use Stripe’s hosted flow.



Admin Tools



Admin features should allow:

view users

view brackets

update game winners

recalculate leaderboard



Admin access should be restricted by email.



Data Model Overview



Expected core tables:



users

brackets

bracket\_picks

teams

games

payments



Relationships:

user → brackets

bracket → picks

games → winners



Mobile Design



Mobile experience is critical.



Guidelines:



Bracket UI should collapse into progressive rounds.

Example:

Round 1

Round 2

Round 3



instead of rendering the entire bracket.



Performance Guidelines



Prioritize:



fast page loads



minimal API calls



simple state management



Do not introduce:



Redux



complex state machines



Unless absolutely necessary.



Error Handling



Error states should be clear.



Examples:



Bracket locked



"The buzzer sounded. Picks are final."



Payment required



"Complete payment to submit this bracket."



Testing Strategy



Claude should perform lightweight testing.



Ensure:



bracket submission works



payment unlock works



leaderboard calculates correctly



admin updates propagate



Deployment



Deployment target:



Netlify



Build command:

npm run build



Publish directory:



dist



Environment variables:



SUPABASE\_URL

SUPABASE\_ANON\_KEY

STRIPE\_PUBLIC\_KEY

STRIPE\_SECRET\_KEY

Development Workflow



Claude should follow this order when building features.



1 Project setup

2 Landing page

3 Authentication

4 Dashboard

5 Bracket builder

6 Database schema

7 Payment flow

8 Leaderboard

9 Admin tools

10 Mobile polish



Do not attempt to build everything at once.



Build iteratively.



Code Quality Expectations



Claude should write code that is:



readable



well structured



commented where helpful



easy to extend



Avoid excessive abstraction.



Favor clarity.



Important Rule



Always prioritize a working MVP.



Do not delay shipping functionality in pursuit of perfection.





