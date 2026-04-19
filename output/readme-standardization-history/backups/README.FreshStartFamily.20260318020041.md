# Fresh Start Family Tree

A lightweight family tree web application with Google authentication and photo gallery. Built to help family members search for relatives and browse through family photos securely.

## Features

- 🔐 **Google Authentication** - Secure login with Google accounts
- 👥 **User Authorization** - Admin can invite family members via email
- 🔍 **Family Search** - Search for family members by name or surname
- 📸 **Photo Gallery** - Browse and view family photos
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🌐 **GitHub Pages Ready** - Easy deployment to GitHub Pages

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- A Google account
- A Firebase account (free tier is sufficient)

### Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Google Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Google" provider
   - Add your domain to authorized domains (e.g., `your-username.github.io`)
4. Enable **Firestore Database**:
   - Go to Firestore Database
   - Create database (start in production mode)
   - Set up security rules (see below)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and select "Web"
   - Copy the configuration object

### Step 2: Configure the Application

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Update Firebase configuration in `src/firebase-config.js`:

   ```javascript
   export const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };

   export const ADMIN_EMAIL = "your-admin-email@example.com";
   ```

4. Update Firestore Security Rules:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Only authenticated users can read their own authorization
       match /authorized_users/{email} {
         allow read: if request.auth != null && request.auth.token.email == email;
         allow write: if request.auth != null &&
           get(/databases/$(database)/documents/authorized_users/$(request.auth.token.email)).data.role == 'admin';
       }
     }
   }
   ```

### Step 3: Development

Run the development server:

```bash
npm run dev
```

The application will open in your browser at `http://localhost:5173`

### Step 4: Build for Production

Build the application:

```bash
npm run build
```

This creates a `dist` folder with the production-ready files.

### Step 5: Deploy to GitHub Pages

#### Option 1: Using GitHub Actions (Recommended)

1. Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest

       steps:
       - uses: actions/checkout@v3

       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'

       - name: Install dependencies
         run: npm ci

       - name: Build
         run: npm run build

       - name: Deploy to GitHub Pages
         uses: peaceiris/actions-gh-pages@v3
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./dist
   ```

2. Enable GitHub Pages:
   - Go to repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`

#### Option 2: Manual Deployment

1. Build the application: `npm run build`
2. Push the `dist` folder to the `gh-pages` branch:

   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

### Step 6: First-Time Admin Access

1. Make sure your email is set as `ADMIN_EMAIL` in `src/firebase-config.js`
2. Visit your deployed site
3. Sign in with Google using your admin email
4. You will be automatically authorized as admin

### Step 7: Invite Family Members

1. Sign in as admin
2. Click the "Admin" button in the header
3. Enter the email address of the family member
4. Click "Send Invite"
5. Share the site URL with the invited family member
6. They can now sign in with their Google account

## Usage

### For Family Members

1. Visit the site URL
2. Click "Sign in with Google"
3. Search for family members using the search box
4. Browse surnames or photos
5. Click on search results to view family pages

### For Administrators

- All features available to family members
- Access to Admin panel for inviting new users
- View list of authorized users

## Project Structure

```
FreshStartFamily/
├── index.html              # Main HTML file
├── package.json            # Node dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js            # Main application logic
│   ├── family-data.js     # Family data parser
│   ├── firebase-config.js # Firebase configuration
│   └── styles/
│       └── main.css       # Application styles
└── FamilyTreeMedia/       # Family tree HTML files and photos
    └── Total Family/      # Generated family tree pages
```

## Security Notes

- Only invited users can access the site
- Firebase Authentication handles secure login
- Firestore rules prevent unauthorized access to user data
- Admin email is the only user who can invite others

## Customization

### Adding More Photos

Edit `src/family-data.js` and add entries to the `photoData` array:

```javascript
photoData = [
    { name: 'Person Name', path: 'path/to/photo.jpg' },
    // Add more...
];
```

### Styling

Edit `src/styles/main.css` to customize colors, fonts, and layout.

### Changing Admin Email

Update `ADMIN_EMAIL` in `src/firebase-config.js`.

## Email Invitations

For production use, consider implementing Firebase Cloud Functions to send actual email invitations:

1. Set up Firebase Cloud Functions
2. Create a function to send emails using a service like SendGrid or Mailgun
3. Update the invite logic in `src/main.js` to call your Cloud Function

Example Cloud Function (not included):

```javascript
exports.sendInvite = functions.https.onCall(async (data, context) => {
    // Verify admin
    // Send email with invite link
    // Return result
});
```

## Support

For issues or questions, please create an issue in the GitHub repository.

## License

This project is for family use only.
