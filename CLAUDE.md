# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal blog built with:
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS v3.3.0
- **Routing**: React Router v6
- **Platform**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **API**: Cloudflare Pages Functions

## Architecture

### Frontend Structure
- React SPA with client-side routing
- Component-based architecture with reusable UI components
- Tailwind CSS for styling with dark theme
- Responsive design for mobile and desktop

### Backend (Cloudflare Pages Functions)
- RESTful API endpoints in `/functions/api/`
- Direct D1 database access from Functions
- No traditional backend server needed

### Database
- D1 (SQLite) for storing posts, comments, and tags
- Schema defined in `schema.sql`
- Direct queries from Pages Functions

## Common Commands

```bash
# Development
npm run dev              # Start Vite dev server (frontend only)
npm run pages:dev        # Run with Wrangler (includes Functions + D1)

# Build & Deploy
npm run build            # Build for production
npm run pages:deploy     # Deploy to Cloudflare Pages

# Database
npx wrangler d1 create cfpress                    # Create D1 database
npx wrangler d1 execute cfpress --file=schema.sql # Initialize schema
npx wrangler d1 execute cfpress --command="..."   # Run SQL command
```

## Project Structure

```
src/
  components/     # Reusable UI components (Layout, Navbar, Sidebar, Footer)
  pages/          # Route-based page components (Home, Thread, Tag, Category, About, Friends)
  App.jsx         # Main app with routing setup
  main.jsx        # Entry point
  index.css       # Tailwind directives and base styles

functions/api/    # Cloudflare Pages Functions (API endpoints)
  posts.js        # GET/POST /api/posts
  posts/[id].js   # GET/PUT/DELETE /api/posts/:id
  comments.js     # GET/POST /api/comments

public/           # Static assets
designs/          # UI design screenshots
schema.sql        # D1 database schema and seed data
```

## Design Guidelines

The blog design is based on screenshots in `/designs/`:
- **Dark theme** with background imagery
- **Semi-transparent cards** for content areas
- **Left sidebar** with profile card and category menu
- **Top navigation bar** with site name, main menu, search functionality, and action icons
- **Main content area** for posts/articles
- **Footer** with copyright and metadata

### Design Files

- `about.png` - About page design
- `search_on_top_navbar.png` - Search functionality in top navigation bar
- Additional page designs (main page, thread, tags, category, etc.)

### Color Scheme (Tailwind Custom Colors)
- Primary background: `bg-primary` (#1a1d29)
- Card background: `bg-card` (rgba(40, 44, 60, 0.6))
- Text primary: `text-primary` (#e0e0e0)
- Text secondary: `text-secondary` (#a0a0a0)
- Accent blue: `accent-blue` (#4a9eff)
- Border: `border` (rgba(255, 255, 255, 0.1))

## Key Pages

- **HomePage** (`/`): Article list with pagination
- **ThreadPage** (`/thread/:id`): Individual post with comments
- **TagPage** (`/tag/:tagName`): Posts filtered by tag
- **CategoryPage** (`/category`): Archive view by year
- **AboutPage** (`/about`): About info
- **FriendsPage** (`/friends`): Friend links

## Cloudflare Pages Setup

1. **Create D1 Database**:
   - Run `npx wrangler d1 create cfpress`
   - Note the database ID
   - Execute schema: `npx wrangler d1 execute cfpress --file=schema.sql`

2. **Deploy to Pages**:
   - Connect GitHub repo or use `wrangler pages deploy`
   - Build command: `npm run build`
   - Build output: `dist`

3. **Bind D1 Database**:
   - In Pages Dashboard → Settings → Functions
   - Add D1 binding: Variable name `DB`, select `cfpress`

## API Reference

All API endpoints are Cloudflare Pages Functions:

- `GET /api/posts` - List posts (returns array)
- `POST /api/posts` - Create post (body: {title, content, tags})
- `GET /api/posts/:id` - Get single post (increments view count)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/comments?post_id=:id` - Get comments for post
- `POST /api/comments` - Create comment (body: {post_id, author, content})

## Important Notes

- Using Tailwind CSS v3.3.0 (stable version)
- designs directory contains UI mockups for reference
- All styling uses Tailwind utility classes
- Mock data in pages will be replaced with D1 API calls

## Future Improvements

- Add Markdown editor for posts
- Implement search functionality
- Add authentication for admin features
- RSS feed generation
- SEO optimization (meta tags, sitemap)
- Image upload with Cloudflare Images
- 当你改代码的时候给出文字说明你改了什么，为什么这么改
- 弹出消息都使用吐司的方式
- init-db.js是负责初始化数据库的，当初次安装或者需要重新更新数据库结构的时候可以调用这个api
- 修改init-db.js或者schema.sql中的任意一个的时候都要彼此同步更新，防止初始化脚本和最终的schema.sql不一致