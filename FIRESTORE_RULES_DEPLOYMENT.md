# Firebase Setup & Security Rules Deployment

## 🌤️ Using Cloudinary for All Images
Your app uses **Cloudinary exclusively** for image handling. No Firebase Storage needed!

## 🔥 Firebase Services Required:
- ✅ **Authentication** (Google Sign-in)
- ✅ **Firestore Database** (User profiles, memes data, XP, achievements, hashtags)
- ❌ **Storage** (Not needed - using Cloudinary)

## 🚨 **IMPORTANT: Updated Security Rules Required**

The app now includes new features that require updated Firestore security rules:
- **XP System** (userXP, xpTransactions collections)
- **Hashtag System** (hashtags, memeHashtags collections)
- **Content Tracking** (contentCounts collection)
- **Leaderboards** (leaderboards collection)

**You MUST deploy the updated security rules for these features to work properly.**

### Option 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Click on "Rules" tab
5. Replace the existing rules with the content from `firestore.rules` file
6. Click "Publish"

### Option 2: Using Firebase CLI
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore` (if not already done)
4. Deploy rules: `firebase deploy --only firestore:rules`

### Current Rules Content:
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to memes for authenticated users
    match /memes/{document} {
      allow read: if true; // Anyone can read memes
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Allow read/write access to user profiles
    match /userProfiles/{userId} {
      // Users can read any profile (for displaying author info)
      allow read: if true;
      
      // Users can only create/update their own profile
      allow create, update: if request.auth != null && request.auth.uid == userId;
      
      // Users can read all profiles for nickname availability checking
      allow list: if request.auth != null;
    }
  }
}
```

After deploying these rules, the nickname availability checking and profile creation should work properly.
