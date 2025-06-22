# 🎬 Lumeroo

<div align="center">

**A modern video and image sharing platform built with Next.js**

![Lumeroo Screenshot](public/screenshot.png)

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)

[Live Demo](https://lumeroo.siddz.com) • [Report Issues](https://github.com/yourusername/lumeroo/issues)

</div>

---

## ✨ Core Features

- **Video & Image Sharing** - Upload and share multimedia content
- **User Authentication** - Secure registration and login system
- **Interactive Comments** - Nested comments with reactions
- **User Profiles** - Customizable user profiles with subscriptions
- **Content Discovery** - Search and explore content
- **Admin Dashboard** - Content moderation and user management

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **MongoDB** database
- **SMTP** server (for emails)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/lumeroo.git
   cd lumeroo
   npm install
   cd Backend && npm install && cd ..
   ```

2. **Configure environment**
   
   **Frontend (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   **Backend (.env)**
   ```env
   DATABASE_URL=mongodb://localhost:27017/lumeroo
   JWT_SECRET=your_jwt_secret
   SMTP_USERNAME=your_smtp_username
   SMTP_PASSWORD=your_smtp_password
   ```

3. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd Backend && npm run dev
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

---

## 🏗️ Architecture

### Video Streaming
Lumeroo includes a **custom self-hosted video streaming solution** built into the backend. You can easily replace this with your preferred video hosting service (Cloudflare Stream, AWS S3, etc.) by modifying the upload and streaming endpoints.

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Node.js, Hono framework, MongoDB
- **Authentication**: JWT with email verification

### Project Structure

```
lumeroo/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── watch/                    # Content viewing page
│   ├── upload/                   # Content upload
│   ├── profile/                  # User profiles
│   ├── search/                   # Search functionality
│   ├── admin/                    # Admin dashboard
│   └── api/                      # API routes
│       └── userAvatar/           # User avatar generation
├── components/                   # React components
│   ├── NavBar.tsx                # Navigation component
│   ├── VideoGrid.tsx             # Video grid display
│   ├── authModel.tsx             # Authentication modal
│   └── ...                       # Other UI components
├── hooks/                        # Custom React hooks
│   └── useUserAvatar.js          # Avatar management hook
├── lib/                          # Utility libraries
├── public/                       # Static assets
│   ├── favicon.ico               # Site favicon
│   └── screenshot.png            # Project showcase image
├── Backend/                      # Server application
│   ├── server.js                 # Main server entry point
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Environment variables
│   ├── models/                   # Database models
│   │   ├── User.js               # User schema
│   │   ├── Video.js              # Video schema
│   │   ├── Image.js              # Image schema
│   │   ├── Comment.js            # Comment schema
│   │   ├── Report.js             # Report schema
│   │   ├── PendingUser.js        # Email verification schema
│   │   ├── PendingPassword.js    # Password reset schema
│   │   └── index.js              # Model exports
│   ├── utils/                    # Utility functions
│   │   └── emailUtils.js         # Email sending utilities
│   └── routes/                   # API endpoints
│       ├── check.js              # Health check
│       ├── signin.js             # User login
│       ├── signup.js             # User registration
│       ├── verify.js             # Email verification
│       ├── resetPass.js          # Password reset request
│       ├── resetVerify.js        # Password reset verification
│       ├── resetDone.js          # Password reset completion
│       ├── resend.js             # Resend verification email
│       ├── googleAuth.js         # Google OAuth authentication
│       ├── uploadVideo.js        # Video upload
│       ├── uploadImage.js        # Image upload
│       ├── content.js            # Content retrieval
│       ├── video.js              # Video streaming
│       ├── image.js              # Image serving
│       ├── comments.js           # Comment system
│       ├── interactions.js       # Likes/subscriptions
│       ├── search.js             # Search functionality
│       ├── profile.js            # User profiles
│       ├── updateAvatar.js       # Profile avatar updates
│       ├── updateBio.js          # Profile bio updates
│       ├── updateUsername.js     # Username updates
│       ├── recommended.js        # Content recommendations
│       ├── related.js            # Related content
│       ├── discover.js           # Content discovery
│       ├── discoverImages.js     # Image discovery
│       ├── reports.js            # Content reporting
│       ├── deleteContent.js      # Content deletion
│       └── deleteUser.js         # User deletion
├── config.json                   # Frontend configuration
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.ts                # Next.js configuration
├── eslint.config.mjs             # ESLint configuration
└── README.md                     # Project documentation
```

---

## 🎯 API Overview (just a few important ones)

### Authentication
- `POST /api/signin` - User login
- `POST /api/signup` - User registration  
- `POST /api/verify` - Email verification

### Content
- `POST /api/uploadVideo` - Upload video
- `POST /api/uploadImage` - Upload images
- `GET /api/content/:slug` - Get content
- `GET /api/video/:id` - Stream video

### Social Features
- `GET /api/comments/:type/:id` - Get comments
- `POST /api/interactions/toggle-like` - Like content
- `POST /api/interactions/subscribe` - Subscribe to users

---

## 🛠️ Customization

### Video Streaming
The default implementation uses a custom backend streaming solution. To use external services:

1. **Replace upload endpoints** in `Backend/routes/uploadVideo.js`
2. **Update streaming logic** in `Backend/routes/video.js`
3. **Modify frontend player** in `app/watch/page.tsx`

### Styling
- **Theme colors**: Edit `tailwind.config.ts`
- **Global styles**: Modify `app/globals.css`

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. **Fork the repository** and clone your fork
2. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push and create a Pull Request**

### Coding Standards

- **ESLint** - Follow the existing linting rules
- **TypeScript** - Use proper type annotations
- **Commit Messages** - Use conventional commits (feat:, fix:, docs:, etc.)
- **Code Style** - Match the existing code formatting

### Areas for Contribution

- 🐛 **Bug Fixes** - Report and fix issues
- ✨ **Features** - Add new functionality
- 📚 **Documentation** - Improve guides and comments
- 🎨 **UI/UX** - Enhance design and user experience
- ⚡ **Performance** - Optimize code and loading times
- 🧪 **Testing** - Add unit and integration tests

### Pull Request Guidelines

- Ensure your PR has a clear title and description
- Reference any related issues
- Include screenshots for UI changes
- Update documentation if needed
- Make sure all tests pass

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the community**

[⭐ Star this project](https://github.com/yourusername/lumeroo)

</div>
