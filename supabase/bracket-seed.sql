-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MOCHA MADNESS — 2026 NCAA Tournament Bracket Seed
-- Projected field as of March 14, 2026 (Selection Sunday eve)
-- 1-seeds: Duke (East), Arizona (West), Florida (South), Michigan (Midwest)
--
-- ⚠️  This WILL clear existing bracket_picks and games/teams.
--     Bracket metadata (user brackets) is preserved.
--     Run the entire script at once in the Supabase SQL Editor.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Clear prior game/team data (preserves user brackets)
TRUNCATE bracket_picks, games, teams RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 2. TEAMS  (64 teams — First Four winners already folded in)
-- ─────────────────────────────────────────────────────────────
INSERT INTO teams (id, name, seed, region) VALUES
-- EAST
(1,  'Duke',          1,  'East'),
(2,  'UConn',         2,  'East'),
(3,  'Illinois',      3,  'East'),
(4,  'Virginia',      4,  'East'),
(5,  'Wisconsin',     5,  'East'),
(6,  'Tennessee',     6,  'East'),
(7,  'UCLA',          7,  'East'),
(8,  'Ohio State',    8,  'East'),
(9,  'Iowa',          9,  'East'),
(10, 'NC State',      10, 'East'),
(11, 'Missouri',      11, 'East'),
(12, 'Yale',          12, 'East'),
(13, 'Hofstra',       13, 'East'),
(14, 'Wright State',  14, 'East'),
(15, 'Furman',        15, 'East'),
(16, 'UMBC',          16, 'East'),
-- WEST
(17, 'Arizona',       1,  'West'),
(18, 'Michigan State',2,  'West'),
(19, 'Gonzaga',       3,  'West'),
(20, 'Kansas',        4,  'West'),
(21, 'Texas Tech',    5,  'West'),
(22, 'BYU',           6,  'West'),
(23, 'Saint Mary''s', 7,  'West'),
(24, 'Utah State',    8,  'West'),
(25, 'Saint Louis',   9,  'West'),
(26, 'Santa Clara',   10, 'West'),
(27, 'UCF',           11, 'West'),
(28, 'McNeese',       12, 'West'),
(29, 'Utah Valley',   13, 'West'),
(30, 'Troy',          14, 'West'),
(31, 'Idaho',         15, 'West'),
(32, 'Long Island',   16, 'West'),
-- SOUTH
(33, 'Florida',       1,  'South'),
(34, 'Iowa State',    2,  'South'),
(35, 'Nebraska',      3,  'South'),
(36, 'Alabama',       4,  'South'),
(37, 'Arkansas',      5,  'South'),
(38, 'Louisville',    6,  'South'),
(39, 'Kentucky',      7,  'South'),
(40, 'Clemson',       8,  'South'),
(41, 'Georgia',       9,  'South'),
(42, 'Texas A&M',     10, 'South'),
(43, 'South Florida', 11, 'South'),
(44, 'Northern Iowa', 12, 'South'),
(45, 'UC-Irvine',     13, 'South'),
(46, 'Kennesaw State',14, 'South'),
(47, 'Queens Univ.',  15, 'South'),
(48, 'Howard',        16, 'South'),
-- MIDWEST
(49, 'Michigan',      1,  'Midwest'),
(50, 'Houston',       2,  'Midwest'),
(51, 'Purdue',        3,  'Midwest'),
(52, 'St. John''s',   4,  'Midwest'),
(53, 'Vanderbilt',    5,  'Midwest'),
(54, 'North Carolina',6,  'Midwest'),
(55, 'Miami FL',      7,  'Midwest'),
(56, 'Villanova',     8,  'Midwest'),
(57, 'TCU',           9,  'Midwest'),
(58, 'VCU',           10, 'Midwest'),
(59, 'Miami OH',      11, 'Midwest'),
(60, 'Akron',         12, 'Midwest'),
(61, 'High Point',    13, 'Midwest'),
(62, 'N. Dakota St.', 14, 'Midwest'),
(63, 'Tennessee St.', 15, 'Midwest'),
(64, 'Siena',         16, 'Midwest');

SELECT setval('teams_id_seq', 64);

-- ─────────────────────────────────────────────────────────────
-- 3. GAMES — insert all 63 games (next_game_id wired below)
-- ─────────────────────────────────────────────────────────────

-- Round 1 — East  (game_ids 1–8)
INSERT INTO games (id, round, region, game_order, team1_id, team2_id) VALUES
(1,  1, 'East', 1,  1,  16),  -- Duke vs UMBC
(2,  1, 'East', 2,  8,  9),   -- Ohio State vs Iowa
(3,  1, 'East', 3,  5,  12),  -- Wisconsin vs Yale
(4,  1, 'East', 4,  4,  13),  -- Virginia vs Hofstra
(5,  1, 'East', 5,  6,  11),  -- Tennessee vs Missouri
(6,  1, 'East', 6,  3,  14),  -- Illinois vs Wright State
(7,  1, 'East', 7,  7,  10),  -- UCLA vs NC State
(8,  1, 'East', 8,  2,  15);  -- UConn vs Furman

-- Round 1 — West  (game_ids 9–16)
INSERT INTO games (id, round, region, game_order, team1_id, team2_id) VALUES
(9,  1, 'West', 1,  17, 32),  -- Arizona vs Long Island
(10, 1, 'West', 2,  24, 25),  -- Utah State vs Saint Louis
(11, 1, 'West', 3,  21, 28),  -- Texas Tech vs McNeese
(12, 1, 'West', 4,  20, 29),  -- Kansas vs Utah Valley
(13, 1, 'West', 5,  22, 27),  -- BYU vs UCF
(14, 1, 'West', 6,  19, 30),  -- Gonzaga vs Troy
(15, 1, 'West', 7,  23, 26),  -- Saint Mary's vs Santa Clara
(16, 1, 'West', 8,  18, 31);  -- Michigan State vs Idaho

-- Round 1 — South  (game_ids 17–24)
INSERT INTO games (id, round, region, game_order, team1_id, team2_id) VALUES
(17, 1, 'South', 1, 33, 48),  -- Florida vs Howard
(18, 1, 'South', 2, 40, 41),  -- Clemson vs Georgia
(19, 1, 'South', 3, 37, 44),  -- Arkansas vs Northern Iowa
(20, 1, 'South', 4, 36, 45),  -- Alabama vs UC-Irvine
(21, 1, 'South', 5, 38, 43),  -- Louisville vs South Florida
(22, 1, 'South', 6, 35, 46),  -- Nebraska vs Kennesaw State
(23, 1, 'South', 7, 39, 42),  -- Kentucky vs Texas A&M
(24, 1, 'South', 8, 34, 47);  -- Iowa State vs Queens Univ.

-- Round 1 — Midwest  (game_ids 25–32)
INSERT INTO games (id, round, region, game_order, team1_id, team2_id) VALUES
(25, 1, 'Midwest', 1, 49, 64),  -- Michigan vs Siena
(26, 1, 'Midwest', 2, 56, 57),  -- Villanova vs TCU
(27, 1, 'Midwest', 3, 53, 60),  -- Vanderbilt vs Akron
(28, 1, 'Midwest', 4, 52, 61),  -- St. John's vs High Point
(29, 1, 'Midwest', 5, 54, 59),  -- North Carolina vs Miami OH
(30, 1, 'Midwest', 6, 51, 62),  -- Purdue vs N. Dakota St.
(31, 1, 'Midwest', 7, 55, 58),  -- Miami FL vs VCU
(32, 1, 'Midwest', 8, 50, 63);  -- Houston vs Tennessee St.

-- Round 2  (game_ids 33–48, teams TBD via picks)
INSERT INTO games (id, round, region, game_order) VALUES
(33, 2, 'East',    1),
(34, 2, 'East',    2),
(35, 2, 'East',    3),
(36, 2, 'East',    4),
(37, 2, 'West',    1),
(38, 2, 'West',    2),
(39, 2, 'West',    3),
(40, 2, 'West',    4),
(41, 2, 'South',   1),
(42, 2, 'South',   2),
(43, 2, 'South',   3),
(44, 2, 'South',   4),
(45, 2, 'Midwest', 1),
(46, 2, 'Midwest', 2),
(47, 2, 'Midwest', 3),
(48, 2, 'Midwest', 4);

-- Sweet 16  (game_ids 49–56)
INSERT INTO games (id, round, region, game_order) VALUES
(49, 3, 'East',    1),
(50, 3, 'East',    2),
(51, 3, 'West',    1),
(52, 3, 'West',    2),
(53, 3, 'South',   1),
(54, 3, 'South',   2),
(55, 3, 'Midwest', 1),
(56, 3, 'Midwest', 2);

-- Elite 8  (game_ids 57–60)
INSERT INTO games (id, round, region, game_order) VALUES
(57, 4, 'East',    1),
(58, 4, 'West',    1),
(59, 4, 'South',   1),
(60, 4, 'Midwest', 1);

-- Final Four  (game_ids 61–62)
INSERT INTO games (id, round, region, game_order) VALUES
(61, 5, 'Final Four', 1),  -- West vs Midwest
(62, 5, 'Final Four', 2);  -- East vs South

-- Championship  (game_id 63)
INSERT INTO games (id, round, region, game_order) VALUES
(63, 6, 'Championship', 1);

SELECT setval('games_id_seq', 63);

-- ─────────────────────────────────────────────────────────────
-- 4. WIRE next_game_id + next_slot
--    Determines where each game's winner advances to
-- ─────────────────────────────────────────────────────────────

-- Round 1 → Round 2  (East)
UPDATE games SET next_game_id = 33, next_slot = 1 WHERE id = 1;
UPDATE games SET next_game_id = 33, next_slot = 2 WHERE id = 2;
UPDATE games SET next_game_id = 34, next_slot = 1 WHERE id = 3;
UPDATE games SET next_game_id = 34, next_slot = 2 WHERE id = 4;
UPDATE games SET next_game_id = 35, next_slot = 1 WHERE id = 5;
UPDATE games SET next_game_id = 35, next_slot = 2 WHERE id = 6;
UPDATE games SET next_game_id = 36, next_slot = 1 WHERE id = 7;
UPDATE games SET next_game_id = 36, next_slot = 2 WHERE id = 8;

-- Round 1 → Round 2  (West)
UPDATE games SET next_game_id = 37, next_slot = 1 WHERE id = 9;
UPDATE games SET next_game_id = 37, next_slot = 2 WHERE id = 10;
UPDATE games SET next_game_id = 38, next_slot = 1 WHERE id = 11;
UPDATE games SET next_game_id = 38, next_slot = 2 WHERE id = 12;
UPDATE games SET next_game_id = 39, next_slot = 1 WHERE id = 13;
UPDATE games SET next_game_id = 39, next_slot = 2 WHERE id = 14;
UPDATE games SET next_game_id = 40, next_slot = 1 WHERE id = 15;
UPDATE games SET next_game_id = 40, next_slot = 2 WHERE id = 16;

-- Round 1 → Round 2  (South)
UPDATE games SET next_game_id = 41, next_slot = 1 WHERE id = 17;
UPDATE games SET next_game_id = 41, next_slot = 2 WHERE id = 18;
UPDATE games SET next_game_id = 42, next_slot = 1 WHERE id = 19;
UPDATE games SET next_game_id = 42, next_slot = 2 WHERE id = 20;
UPDATE games SET next_game_id = 43, next_slot = 1 WHERE id = 21;
UPDATE games SET next_game_id = 43, next_slot = 2 WHERE id = 22;
UPDATE games SET next_game_id = 44, next_slot = 1 WHERE id = 23;
UPDATE games SET next_game_id = 44, next_slot = 2 WHERE id = 24;

-- Round 1 → Round 2  (Midwest)
UPDATE games SET next_game_id = 45, next_slot = 1 WHERE id = 25;
UPDATE games SET next_game_id = 45, next_slot = 2 WHERE id = 26;
UPDATE games SET next_game_id = 46, next_slot = 1 WHERE id = 27;
UPDATE games SET next_game_id = 46, next_slot = 2 WHERE id = 28;
UPDATE games SET next_game_id = 47, next_slot = 1 WHERE id = 29;
UPDATE games SET next_game_id = 47, next_slot = 2 WHERE id = 30;
UPDATE games SET next_game_id = 48, next_slot = 1 WHERE id = 31;
UPDATE games SET next_game_id = 48, next_slot = 2 WHERE id = 32;

-- Round 2 → Sweet 16  (East)
UPDATE games SET next_game_id = 49, next_slot = 1 WHERE id = 33;
UPDATE games SET next_game_id = 49, next_slot = 2 WHERE id = 34;
UPDATE games SET next_game_id = 50, next_slot = 1 WHERE id = 35;
UPDATE games SET next_game_id = 50, next_slot = 2 WHERE id = 36;

-- Round 2 → Sweet 16  (West)
UPDATE games SET next_game_id = 51, next_slot = 1 WHERE id = 37;
UPDATE games SET next_game_id = 51, next_slot = 2 WHERE id = 38;
UPDATE games SET next_game_id = 52, next_slot = 1 WHERE id = 39;
UPDATE games SET next_game_id = 52, next_slot = 2 WHERE id = 40;

-- Round 2 → Sweet 16  (South)
UPDATE games SET next_game_id = 53, next_slot = 1 WHERE id = 41;
UPDATE games SET next_game_id = 53, next_slot = 2 WHERE id = 42;
UPDATE games SET next_game_id = 54, next_slot = 1 WHERE id = 43;
UPDATE games SET next_game_id = 54, next_slot = 2 WHERE id = 44;

-- Round 2 → Sweet 16  (Midwest)
UPDATE games SET next_game_id = 55, next_slot = 1 WHERE id = 45;
UPDATE games SET next_game_id = 55, next_slot = 2 WHERE id = 46;
UPDATE games SET next_game_id = 56, next_slot = 1 WHERE id = 47;
UPDATE games SET next_game_id = 56, next_slot = 2 WHERE id = 48;

-- Sweet 16 → Elite 8
UPDATE games SET next_game_id = 57, next_slot = 1 WHERE id = 49;
UPDATE games SET next_game_id = 57, next_slot = 2 WHERE id = 50;
UPDATE games SET next_game_id = 58, next_slot = 1 WHERE id = 51;
UPDATE games SET next_game_id = 58, next_slot = 2 WHERE id = 52;
UPDATE games SET next_game_id = 59, next_slot = 1 WHERE id = 53;
UPDATE games SET next_game_id = 59, next_slot = 2 WHERE id = 54;
UPDATE games SET next_game_id = 60, next_slot = 1 WHERE id = 55;
UPDATE games SET next_game_id = 60, next_slot = 2 WHERE id = 56;

-- Elite 8 → Final Four  (West vs Midwest = FF1/game 61; East vs South = FF2/game 62)
UPDATE games SET next_game_id = 62, next_slot = 1 WHERE id = 57;  -- East champ → FF2
UPDATE games SET next_game_id = 61, next_slot = 2 WHERE id = 58;  -- West champ → FF1
UPDATE games SET next_game_id = 62, next_slot = 2 WHERE id = 59;  -- South champ → FF2
UPDATE games SET next_game_id = 61, next_slot = 1 WHERE id = 60;  -- Midwest champ → FF1

-- Final Four → Championship
UPDATE games SET next_game_id = 63, next_slot = 1 WHERE id = 61;
UPDATE games SET next_game_id = 63, next_slot = 2 WHERE id = 62;

-- ─────────────────────────────────────────────────────────────
-- Done! Verify with:
-- SELECT round, region, game_order, t1.name team1, t2.name team2
-- FROM games g
-- LEFT JOIN teams t1 ON t1.id = g.team1_id
-- LEFT JOIN teams t2 ON t2.id = g.team2_id
-- WHERE round = 1 ORDER BY region, game_order;
-- ─────────────────────────────────────────────────────────────
