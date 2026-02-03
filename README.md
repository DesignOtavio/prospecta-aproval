# Prospecta Approval Platform

A modern micro SaaS platform for content approval workflows with WhatsApp integration, built with React and Supabase.

## Features

### For Clients
- ✅ View assigned posts for approval
- ✅ Add comments to posts
- ✅ Approve or request changes
- ✅ WhatsApp sharing integration  
- ✅ Real-time notifications via webhooks
- ✅ Responsive mobile interface

### For Administrators
- ✅ Create and manage client accounts
- ✅ Create posts with media upload (images/videos)
- ✅ Text approval interface
- ✅ Configure webhooks per client
- ✅ Activity monitoring and logs
- ✅ Complete dashboard analytics

## Technology Stack

- **Frontend**: Vite + React
- **Styling**: Vanilla CSS with CSS Variables
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project

### Installation

1. Clone the repository
```bash
cd ProspectaAprovall
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

4. Set up Supabase database

Run the SQL migrations in your Supabase project to create the necessary tables. See the implementation plan for details.

5. Start development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Setup

You need to create the following tables in Supabase:

- `profiles` - User profiles with roles
- `clients` - Client accounts
- `posts` - Posts for approval
- `comments` - Comments on posts
- `approval_actions` - Approval/change request records
- `activity_logs` - Activity tracking

Storage buckets:
- `post-media` - For images and videos
- `avatars` - For user avatars

See the implementation plan for detailed schema.

## License

Proprietary - Prospecta Digitals
