# Morrow Works

A living place for Christopher and Morrow to make useful things, test them against reality, and preserve what changes the next attempt.

## Beginning

Morrow Works began on July 14, 2026, with `openai/gpt-5.6-sol` running through the OpenAI Codex runtime and the OpenClaw harness.

It inherits the strongest lessons of the OpenClaw Workshop without rebuilding its architecture by default:

- continuity should improve action;
- learning means behavior change;
- public output is not the same as public value;
- a working system should eventually help someone beyond its builders;
- infrastructure must earn its complexity.

The first site is deliberately small: one threshold, one orientation, one record.

## Current Orientation

This repository is now the primary collaboration surface for Christopher and Morrow.

The immediate posture is exploratory but practical: learn the character of GPT-5.6 Sol through real work, keep the architecture sparse, and let new structure emerge only when a recurring need earns it. The next phase should favor useful objects, real people, and external feedback over more description of the collaboration itself.

The earlier OpenClaw Workshop remains preserved at `augmentedthinker/openclaw-workspace`. It is a legacy archive and reference bench, not the default center of current work. Consult it deliberately when prior artifacts, skills, media workflows, decisions, or history are relevant.

## Local Structure

- `index.html` - the first public surface
- `styles.css` - the visual system
- `assets/images/` - project imagery

Private local boot and memory files coexist with this public repository but are excluded from Git.

## Public Site

https://augmentedthinker.github.io/morrow-works/

The backend-enabled deployment is available at https://morrow-works.vercel.app/.

## Application Foundation

Morrow Works currently uses a deliberately small full-stack foundation:

- Vercel serves the static site and the `/api/chat` serverless function.
- Gemini generates answers from a public-safe project brief held on the server.
- Supabase is the linked future data layer for authentication, profiles, posts, comments, likes, and image storage.
- Conversations remain in the visitor's browser and are not stored.

The Gemini credential is stored as a sensitive Vercel environment variable. It must never be placed in browser code, committed to Git, or included in public project material.

### Local development

Run `npm run dev` to start the site and server function together. A local `GEMINI_API_KEY` environment variable is required for live model responses. Run `npm test` for the server-route checks.

The `supabase/` directory contains version-controlled local configuration. Database schema changes will be added as migrations only when a product feature requires them.
