# Quick Setup Guide for Living Family Archive

Follow these steps to get your family tree site up and running.

## Step-by-Step Setup

### 1. Firebase Project Setup (15 minutes)

1. **Create Firebase Project**
   - Visit <https://console.firebase.google.com>
   - Click "Add project"
   - Enter project name: "LivingFamilyArchive"
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Authentication**
   - In Firebase Console, click "Authentication" in the left menu
   - Click "Get started"
   - Click "Sign-in method" tab
   - Click "Google" provider
   - Toggle "Enable"
   - Click "Save"

3. **Enable Firestore Database**
   - Click "Firestore Database" in the left menu
   - Click "Create database"
   - Select "Start in production mode"
   - Choose a location (closest to your users)
   - Click "Enable"

4. **Set Firestore Security Rules**
   - In Firestore, click "Rules" tab
   - Replace the rules with:

   ```
   // Only authenticated users can read their own authorization
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /authorized_users/{email} {
         allow read: if request.auth != null && request.auth.token.email == email;
         allow write: if request.auth != null &&
           get(/databases/$(database)/documents/authorized_users/$(request.auth.token.email)).data.role == 'admin';
       }
     }
   }
   ```

   - Click "Publish"

5. **Get Firebase Configuration**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Click "Project settings"
   - Scroll down to "Your apps"
   - Click the "</>" (Web) icon
   - Enter app nickname: "LivingFamilyArchive"
   - Click "Register app"
   - Copy the `firebaseConfig` object shown

### 2. Update Application Configuration (5 minutes)

1. **Edit Firebase Config**
   - Open `src/firebase-config.js`
   - Replace the placeholder values with your Firebase config:

   ```javascript
   export const firebaseConfig = {
       apiKey: "YOUR_API_KEY_FROM_FIREBASE",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };

   export const ADMIN_EMAIL = "your.email@gmail.com"; // Use YOUR email here
   ```

2. **Save the file**

### 3. Test Locally (5 minutes)

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Development Server**

   ```bash
   npm run dev
   ```

3. **Test the Application**
   - Browser should open automatically at <http://localhost:5173>
   - Click "Sign in with Google"
   - Sign in with your admin email
   - You should see the main application

### 4. Deploy to GitHub Pages (10 minutes)

1. **Configure GitHub Pages**
   - Go to your GitHub repository
   - Click "Settings" > "Pages"
   - Under "Build and deployment"
   - Source: "GitHub Actions"

2. **Add Authorized Domain in Firebase**
   - Go to Firebase Console > Authentication > Settings
   - Scroll to "Authorized domains"
   - Click "Add domain"
   - Add: `YOUR-USERNAME.github.io`
   - Click "Add"

3. **Push Code to GitHub**

   ```bash
   git add .
   git commit -m "Setup family tree application"
   git push origin main
   ```

4. **Wait for Deployment**
   - Go to your repository > "Actions" tab
   - Watch the deployment workflow run
   - Once complete, visit: `https://YOUR-USERNAME.github.io/FreshStartFamily`

### 5. Invite Family Members (2 minutes per person)

1. **Access Admin Panel**
   - Sign in to your deployed site
   - Click "Admin" button in the header

2. **Send Invitations**
   - Enter family member's email
   - Click "Send Invite"
   - Copy the site URL shown
   - Send the URL to your family member via email

3. **Family Member Access**
   - They visit the URL you sent
   - Click "Sign in with Google"
   - They must sign in with the exact email you invited

## Troubleshooting

### "Not authorized" message after signing in

- Make sure you entered your email correctly in `src/firebase-config.js`
- Clear your browser cache and try again
- Check Firebase Console > Firestore > authorized_users collection

### "Firebase error" during sign-in

- Verify all Firebase config values are correct
- Check that your domain is in Firebase's authorized domains list
- Make sure Google sign-in is enabled in Firebase Console

### GitHub Pages shows 404

- Check that GitHub Actions workflow completed successfully
- Verify Pages is enabled in repository settings
- Wait a few minutes after deployment

### Photos not loading

- Check that photo paths in `src/family-data.js` are correct
- Verify image files exist in the `FamilyTreeMedia` folder
- Check browser console for 404 errors

## Next Steps

1. **Test All Features**
   - Search for family members
   - Browse surnames
   - View photo gallery
   - Test invite system

2. **Add More Photos**
   - Edit `src/family-data.js`
   - Add photo entries to the `photoData` array
   - Rebuild and deploy

3. **Customize Appearance**
   - Edit `src/styles/main.css`
   - Change colors in the `:root` CSS variables
   - Rebuild and deploy

4. **Invite Family**
   - Start with a few trusted family members
   - Gradually invite more as needed
   - Consider creating a family email list

## Important Security Notes

- ⚠️ Never commit your Firebase config to a public repository if it contains sensitive data
- 🔒 Only invite trusted family members
- 👤 Keep your admin credentials secure
- 📧 Verify email addresses before sending invites

## Need Help?

- Check the main README.md for detailed documentation
- Review Firebase documentation: <https://firebase.google.com/docs>
- Create an issue in the GitHub repository

---

**Estimated Total Setup Time: 30-40 minutes**

Once set up, inviting new family members takes only 2 minutes!
