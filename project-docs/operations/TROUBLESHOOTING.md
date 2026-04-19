# Troubleshooting Guide

Common issues and their solutions for the Living Family Archive application.

## Authentication Issues

### "Not authorized to access this site" after signing in

**Problem**: User sees error message even though they were invited.

**Solutions**:

1. Verify the user is signing in with the EXACT email address that was invited
2. Check Firebase Console > Firestore Database > authorized_users collection
   - Ensure the user's email is in the collection
3. If the admin is getting this error:
   - Verify `ADMIN_EMAIL` in `src/firebase-config.js` matches exactly
   - Sign out and sign in again
   - Check browser console for errors

### Sign-in popup closes immediately

**Problem**: Google sign-in popup appears and closes without signing in.

**Solutions**:

1. Check Firebase Console > Authentication > Settings > Authorized domains
   - Ensure your domain (e.g., `username.github.io`) is listed
   - Add `localhost` for local development
2. Clear browser cache and cookies
3. Try a different browser or incognito mode
4. Ensure popup blockers are disabled

### "Firebase: Error (auth/popup-blocked)"

**Problem**: Browser is blocking the sign-in popup.

**Solutions**:

1. Allow popups for your site in browser settings
2. Click the popup blocker icon in the address bar
3. Add your site to the browser's allowed list

## Firebase Configuration Issues

### "Firebase: Firebase App named '[DEFAULT]' already exists"

**Problem**: Firebase is being initialized multiple times.

**Solutions**:

1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Check that you haven't included Firebase scripts multiple times

### Firebase config values showing as "undefined"

**Problem**: Firebase configuration is not loading correctly.

**Solutions**:

1. Verify `src/firebase-config.js` has been updated with your project values
2. Ensure no typos in the config object
3. Check that all required fields are present:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)"

**Problem**: The deployed app is using an invalid value for `VITE_FIREBASE_API_KEY`.

**Solutions**:

1. Verify the GitHub Actions secret for `PROD_FIREBASE_API_KEY` or `STAGING_FIREBASE_API_KEY`
   - It must be the Firebase Web API key from Firebase Console > Project settings > Your apps > Web app
   - It should look like `AIza...`
2. Do not use a service-account private key or the JSON from `FIREBASE_SERVICE_ACCOUNT_*`
3. Re-run the deploy workflow after fixing the secret
4. Use `npm run validate-firebase-config` locally or in CI to catch the mistake before deployment

## Deployment Issues

### GitHub Pages shows 404 error

**Problem**: Deployed site shows "404 - Page not found".

**Solutions**:

1. Check GitHub repository settings:
   - Settings > Pages
   - Ensure source is set to "GitHub Actions"
2. Verify the workflow completed successfully:
   - Go to repository > Actions tab
   - Check if the latest workflow run succeeded
3. Wait 2-3 minutes after deployment for changes to propagate
4. Clear browser cache and try again
5. Check that `index.html` is in the root of the `dist` folder

### GitHub Actions workflow failing

**Problem**: The deployment workflow shows errors.

**Solutions**:

1. Check the workflow logs in the Actions tab
2. Common causes:
   - **npm ci fails**: Delete `package-lock.json` and run `npm install` locally, then commit
   - **Build fails**: Run `npm run build` locally to see the actual error
   - **Permission denied**: Check repository Settings > Actions > General > Workflow permissions
3. Re-run the workflow after fixing issues

### Photos not loading on GitHub Pages

**Problem**: Photos show broken images or 404 errors.

**Solutions**:

1. Verify photos exist in the `FamilyTreeMedia` directory
2. Check that `photo-catalog.json` was generated:
   - Run `npm run catalog-photos` locally
3. Ensure the post-build script ran successfully:
   - Check GitHub Actions logs for "Copying FamilyTreeMedia"
4. Verify photo paths in `photo-catalog.json` are correct
5. Check browser console for specific 404 errors

## Search and Display Issues

### Search returns no results

**Problem**: Searching for family members shows "No family members found".

**Solutions**:

1. Check that `FamilyTreeMedia/Total Family/names.htm` exists
2. Open browser console and look for fetch errors
3. Try searching with fewer characters (at least 2)
4. Verify the search term matches names in the family tree
5. Check that the family data initialized correctly:
   - Open browser console
   - Type `localStorage.clear()` and refresh

### Family pages not displaying

**Problem**: Clicking search results doesn't show the family page.

**Solutions**:

1. Verify the HTML files exist in `FamilyTreeMedia/Total Family/`
2. Check browser console for errors
3. Ensure the iframe has proper permissions
4. Try opening the family page URL directly

### "Family directory returned text/html instead of JSON"

**Problem**: The app fell back to root JSON files such as `directory.json`, but the hosted site only serves `index.html` from Firebase Hosting.

**Solutions**:

1. Sign in successfully first so the app can load the protected JSON files from Firebase Storage
2. If sign-in is also failing with `auth/api-key-not-valid`, fix the Firebase Web API key first
3. Use `localhost` for local JSON fallback; hosted builds do not serve `directory.json`, `person-details.json`, or the other protected artifacts from the site root

### Photo gallery shows no images

**Problem**: Photo gallery appears but no images are displayed.

**Solutions**:

1. Check that `photo-catalog.json` exists in the dist folder
2. Run `npm run catalog-photos` to regenerate the catalog
3. Verify photos exist in the `FamilyTreeMedia` folder
4. Check browser console for loading errors
5. Ensure photos have valid extensions (.jpg, .jpeg, .png, .gif)

## Local Development Issues

### "npm run dev" fails

**Problem**: Development server won't start.

**Solutions**:

1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Ensure Node.js version is 16 or higher: `node --version`
5. Try `npm cache clean --force`

### Changes not appearing in browser

**Problem**: Code changes don't show up when developing locally.

**Solutions**:

1. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
2. Check that Vite server is running
3. Look for errors in the terminal
4. Clear browser cache
5. Restart the dev server

### Port 5173 already in use

**Problem**: Vite can't start because port is already in use.

**Solutions**:

1. Stop any other Vite instances
2. Specify a different port: `vite --port 3000`
3. Or update `vite.config.js`:
   ```javascript
   server: {
     port: 3000,
     open: true,
   }
   ```

## Admin Panel Issues

### Admin button not showing

**Problem**: Admin button doesn't appear in the header.

**Solutions**:

1. Verify you're signed in with the admin email
2. Check that `ADMIN_EMAIL` in `src/firebase-config.js` matches exactly
3. Sign out and sign in again
4. Check browser console for errors

### "Failed to send invitation" error

**Problem**: Inviting users shows an error.

**Solutions**:

1. Check Firestore security rules are set correctly
2. Verify you're signed in as admin
3. Ensure the email format is valid
4. Check browser console for specific error messages
5. Verify Firestore Database is enabled in Firebase Console

### Invited users not appearing in list

**Problem**: The authorized users list is empty or incomplete.

**Solutions**:

1. Refresh the admin panel
2. Check Firebase Console > Firestore Database > authorized_users
3. Verify Firestore rules allow reading the collection
4. Check browser console for errors
5. Ensure Firestore Database was created in the same Firebase project

## Performance Issues

### Site loads slowly

**Problem**: Application takes a long time to load.

**Solutions**:

1. Check internet connection speed
2. Optimize images (consider resizing large photos)
3. Enable browser caching
4. Use a CDN for Firebase libraries (already configured)
5. Check browser console for slow network requests

### Photo gallery is slow

**Problem**: Photo gallery takes a long time to display.

**Solutions**:

1. Images are loading on-demand (lazy loading is implemented)
2. Consider reducing image file sizes
3. Use image optimization tools before uploading
4. Limit the number of photos displayed at once

## Browser Compatibility Issues

### Site doesn't work in Internet Explorer

**Problem**: Application doesn't load in IE.

**Solutions**:

- Internet Explorer is not supported
- Use a modern browser: Chrome, Firefox, Safari, or Edge

### Issues in Safari

**Problem**: Some features don't work in Safari.

**Solutions**:

1. Update Safari to the latest version
2. Enable cookies and JavaScript
3. Check Safari's privacy settings
4. Try using Chrome or Firefox instead

## Getting Help

If none of these solutions work:

1. **Check Browser Console**:
   - Press F12 to open Developer Tools
   - Look at the Console tab for error messages
   - Take a screenshot of any errors

2. **Check Firebase Console**:
   - Review Authentication logs
   - Check Firestore rules
   - Verify service status

3. **Create a GitHub Issue**:
   - Go to the repository
   - Click "Issues" > "New Issue"
   - Provide:
     - Description of the problem
     - Steps to reproduce
     - Browser and OS version
     - Screenshots of errors
     - Any console messages

4. **Review Documentation**:
   - README.md - Full documentation
   - project-docs/operations/SETUP_GUIDE.md - Setup instructions
   - Firebase docs - https://firebase.google.com/docs

## Preventive Maintenance

To avoid issues:

1. **Keep dependencies updated**:
   ```bash
   npm update
   ```

2. **Regular backups**:
   - Export Firestore data regularly
   - Keep a backup of your Firebase config

3. **Monitor Firebase usage**:
   - Check Firebase Console > Usage
   - Stay within free tier limits

4. **Test before inviting users**:
   - Test all features after deployment
   - Verify search, photos, and authentication work
   - Test on multiple browsers

5. **Document customizations**:
   - Keep notes on any changes you make
   - Comment your code modifications
