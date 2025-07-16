# 🔥 COMPLETE FIREBASE COLLECTIONS LIST - Snacx Meme App

## 📋 **ALL FIREBASE COLLECTIONS REQUIRING RULES**

Based on comprehensive codebase analysis, here are **ALL** Firebase collections used in your Snacx app:

### **🔐 CORE USER & CONTENT COLLECTIONS**

1. **`userProfiles`** - User account data, profiles, stats
   - **Operations:** Read (public), Create/Update (owner), Delete (admin)
   - **Used by:** UserService, authentication, profiles

2. **`memes`** - Main meme posts with metadata
   - **Operations:** Read (public), Create (auth), Update/Delete (owner/admin)
   - **Used by:** MemeCard, upload, feeds, search

3. **`commentReplies`** - Nested comment replies
   - **Operations:** Read (public), Create/Update (owner), Delete (owner/admin/post-author)
   - **Used by:** CommentThread, CommentService

### **🎯 XP & ACHIEVEMENT SYSTEM**

4. **`userXP`** - User experience points and levels
   - **Operations:** Read (public), Create/Update (owner/admin), Delete (admin)
   - **Used by:** XPService, level badges, achievements

5. **`xpTransactions`** - XP transaction history
   - **Operations:** Read (owner/admin), Create (owner/admin), Update/Delete (admin)
   - **Used by:** XPService, transaction tracking

6. **`userAchievements`** - User unlocked achievements
   - **Operations:** Read (public), Create/Update (owner/admin), Delete (admin)
   - **Used by:** AchievementService, profile badges

7. **`achievementProgress`** - Progress tracking for achievements
   - **Operations:** Read/Write (owner/admin), Delete (admin)
   - **Used by:** AchievementService, progress tracking

### **👥 SOCIAL FEATURES**

8. **`follows`** - User follow relationships
   - **Operations:** Read (public), Create (follower), Delete (follower/admin)
   - **Used by:** FollowService, FollowButton, social features

9. **`followStats`** - Aggregated follower/following counts
   - **Operations:** Read (public), Create/Update (auth), Delete (admin)
   - **Used by:** FollowService, profile stats

10. **`notifications`** - Real-time notification system
    - **Operations:** Read/Update/Delete (owner/admin), Create (auth)
    - **Used by:** NotificationService, NotificationBell

11. **`userInteractions`** - User likes, bookmarks tracking
    - **Operations:** Read/Create/Update/Delete (owner/admin)
    - **Used by:** UserInteractionService, likes, bookmarks

### **💬 MESSAGING SYSTEM**

12. **`chatRooms`** - Chat room data and settings
    - **Operations:** Read/Update (participants/admin), Create (auth), Delete (creator/admin)
    - **Used by:** ChatService, ChatInterface

13. **`chatMessages`** - All chat messages
    - **Operations:** Read/Create (participants), Update/Delete (sender/admin)
    - **Used by:** ChatService, real-time messaging

14. **`blockedUsers`** - User blocking relationships
    - **Operations:** Read/Create/Delete (blocker/admin)
    - **Used by:** BlockingService, UserBlockingModal

15. **`mutedUsers`** - User muting with expiration
    - **Operations:** Read/Create/Update/Delete (muter/admin)
    - **Used by:** BlockingService, muting functionality

### **🏷️ CONTENT MANAGEMENT**

16. **`hashtags`** - Hashtag data and trends
    - **Operations:** Read (public), Create/Update (auth), Delete (admin)
    - **Used by:** HashtagService, trending hashtags

17. **`memeHashtags`** - Meme-hashtag relationships
    - **Operations:** Read (public), Create/Update (auth), Delete (owner/admin)
    - **Used by:** HashtagService, meme tagging

18. **`contentCounts`** - User content statistics
    - **Operations:** Read (public), Create/Update (owner/admin), Delete (admin)
    - **Used by:** ContentCountService, achievement tracking

### **📊 ANALYTICS & TRACKING**

19. **`memeViews`** - Individual view tracking
    - **Operations:** Read (public), Create (auth), Update/Delete (admin)
    - **Used by:** ViewTrackingService, analytics

20. **`viewStats`** - Aggregated view statistics
    - **Operations:** Read (public), Create/Update (auth), Delete (admin)
    - **Used by:** ViewTrackingService, trending algorithms

### **🏆 LEADERBOARDS & RANKINGS**

21. **`leaderboards`** - User rankings and leaderboards
    - **Operations:** Read (public), Create/Update (auth), Delete (admin)
    - **Used by:** LeaderboardService, ranking displays

22. **`monthlyLeaderboards`** - Monthly ranking data
    - **Operations:** Read (public), Create/Update (auth), Delete (admin)
    - **Used by:** EnhancedLeaderboardService, monthly rankings

### **🛡️ SYSTEM & ADMIN**

23. **`badgeExplanations`** - Badge information and requirements
    - **Operations:** Read (public), Create/Update/Delete (admin)
    - **Used by:** BadgeExplanationService, badge tooltips

24. **`adminUsers`** - Admin user list
    - **Operations:** Read (auth), Create/Update/Delete (admin)
    - **Used by:** AdminService, admin permissions

25. **`adminActions`** - Admin action logs
    - **Operations:** Read/Create (admin), Update/Delete (false)
    - **Used by:** AdminService, audit trails

26. **`admins`** - Admin configuration
    - **Operations:** Read (auth), Create/Update/Delete (admin)
    - **Used by:** AdminService, admin management

27. **`systemConfig`** - App configuration settings
    - **Operations:** Read (public), Create/Update/Delete (admin)
    - **Used by:** System configuration, app settings

28. **`appStats`** - Application usage statistics
    - **Operations:** Read (public), Create/Update (auth), Delete (admin)
    - **Used by:** Analytics, app monitoring

## 🔍 **SPECIAL NOTES:**

### **Comments Handling:**
- **Comments are stored as arrays within meme documents**, not as a separate collection
- **`commentReplies`** is a separate collection for nested replies

### **Real-time Collections:**
- **`chatMessages`** - Real-time messaging
- **`notifications`** - Live notifications
- **`chatRooms`** - Live chat updates

### **Security-Critical Collections:**
- **`adminUsers`** - Controls admin access
- **`blockedUsers`** - User safety features
- **`userInteractions`** - Private user data

## 🎯 **TOTAL COLLECTIONS: 28**

All these collections are covered in the **`FINAL_FIREBASE_RULES_COMPLETE.rules`** file with appropriate security rules for each use case.

## 🚀 **DEPLOYMENT INSTRUCTIONS:**

1. **Copy the entire content** from `FINAL_FIREBASE_RULES_COMPLETE.rules`
2. **Go to Firebase Console** → **Firestore Database** → **Rules**
3. **Replace ALL existing rules** with the new comprehensive rules
4. **Click "Publish"**
5. **Create the required composite index** for chatRooms (from the error message)

**These rules provide complete security coverage for your entire Snacx meme app!** 🔥
