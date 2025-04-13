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

## External Image Storage Solution

This project uses Cloudinary as an alternative to Firebase Storage for hosting user profile photos and images. This approach provides several benefits:

- Free tier with generous limits
- No CORS issues during development
- CDN-delivered images with automatic optimization

## Setup Instructions

### 1. Create a Cloudinary Account

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/)
2. After signing up, you'll get your cloud name, API key, and API secret

### 2. Create an Upload Preset

1. In your Cloudinary dashboard, go to Settings > Upload
2. Scroll down to "Upload presets" and click "Add upload preset"
3. For development, you can set it to "unsigned" (less secure but easier for development)
4. Set any restrictions you want (file types, max size, etc.)
5. Save the preset name

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Fill in your Cloudinary credentials:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here  
   VITE_CLOUDINARY_API_KEY=your_api_key_here
   ```

### 4. Testing Image Uploads

1. Start the development server
2. Go to the profile page and try uploading an image
3. You should see the image upload progress, and then the displayed profile photo

## Security Considerations

For production environments, you should use signed uploads to Cloudinary:

1. Create a server-side API endpoint that generates a signature using your API secret
2. Modify the cloudinaryUpload.js utility to use the signed upload approach
3. Never expose your Cloudinary secret key in the frontend code

## Troubleshooting

If image uploads fail:

1. Check browser console for any error messages
2. Verify your Cloudinary credentials in .env file
3. Make sure your upload preset is configured correctly
4. Check if the image file size is under the limits (default 5MB in our code)

## Fallback Mechanism

The app has a built-in fallback mechanism if Cloudinary uploads fail:

1. If an upload fails, the app will generate a placeholder image with the user's initials
2. This ensures users can still complete their profiles even if image uploads have issues 