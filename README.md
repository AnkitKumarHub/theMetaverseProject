# The Metaverse Street Journal

A modern, interactive web application for publishing and managing articles about the Metaverse. Built with React, Firebase, and Tailwind CSS.

## Features

### User Authentication
- Secure login and signup with email/password
- Google authentication integration
- Protected routes for authenticated users only

### Article Management
- Create, edit, and publish articles
- Draft system for works in progress
- Rich text editor with formatting options
- Image uploads for featured images
- Custom URLs (slugs) for better SEO
- Tagging system for categorization

### User Dashboard
- Overview of published articles
- Analytics for article views
- Manage your content in one place

### Article Display
- Beautiful, responsive article layouts
- Social sharing capabilities
- Related articles suggestions

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Editor**: TipTap (based on ProseMirror)
- **Deployment**: Firebase Hosting

## Project Structure

```
metaverse-journal/
├── public/              # Static files
├── src/
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── pages/           # Main page components
│   │   ├── Home.jsx     # Landing page
│   │   ├── Dashboard.jsx # User dashboard
│   │   ├── ArticleView.jsx # Display single article
│   │   ├── EditArticle.jsx # Edit article form
│   │   └── UserContentPage.jsx # User's content management
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── firebase.js          # Firebase configuration
└── package.json         # Dependencies and scripts
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your Firebase project and configure firebase.js with your credentials
4. Run the development server:
   ```
   npm run dev
   ```

## Features In Detail

### View Articles
Browse and read articles with a beautiful UI optimized for readability. Articles include:
- Featured image
- Author information
- Publication date
- Content with rich formatting
- Related tags
- Call to action

### Edit Articles
Edit your published articles with a feature-rich editor:
- Update title, content, and metadata
- Change featured image
- Manage tags
- Update SEO-friendly URL slug
- Rich text formatting options

## License

MIT 