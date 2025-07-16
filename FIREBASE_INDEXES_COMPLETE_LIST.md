# 🔥 COMPLETE FIREBASE INDEXES - Snacx Meme App

## 📋 **ALL REQUIRED FIREBASE INDEXES**

### **🔗 DIRECT LINKS TO CREATE INDEXES:**

#### **Index 1: Chat Messages (chatId + timestamp ascending)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClVwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0TWVzc2FnZXMvaW5kZXhlcy9fEAEaCgoGY2hhdElkEAEaDQoJdGltZXN0YW1wEAEaDAoIX19uYW1lX18QAQ
```

#### **Index 1B: Chat Messages (chatId + timestamp descending)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClVwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0TWVzc2FnZXMvaW5kZXhlcy9fEAEaCgoGY2hhdElkEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg
```

#### **Index 2: Chat Messages (chatId + readBy)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClVwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0TWVzc2FnZXMvaW5kZXhlcy9fEAEaCgoGY2hhdElkEAEaCgoGcmVhZEJ5EAEaDAoIX19uYW1lX18QAQ
```

#### **Index 3: Comment Replies (parentCommentId + timestamp)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=Cldwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50UmVwbGllcy9pbmRleGVzL18QARoTCg9wYXJlbnRDb21tZW50SWQQARoNCgl0aW1lc3RhbXAQARoMCghfX25hbWVfXxAB
```

#### **Index 4: Follows (followingId + createdAt)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClBwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9mb2xsb3dzL2luZGV4ZXMvXxABGg8KC2ZvbGxvd2luZ0lkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

#### **Index 5: Chat Rooms (participants + isActive + lastActivity)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClJwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0Um9vbXMvaW5kZXhlcy9fEAEaEAoMcGFydGljaXBhbnRzGAEaDAoIaXNBY3RpdmUQARoQCgxsYXN0QWN0aXZpdHkQAhoMCghfX25hbWVfXxAC
```

#### **Index 6: User Interactions (userId + type + createdAt)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2VySW50ZXJhY3Rpb25zL2luZGV4ZXMvXxABGgwKCHVzZXJJZBEBGgoKBHR5cGUQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

#### **Index 7: Memes (trendingScore + createdAt)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tZW1lcy9pbmRleGVzL18QARoPCgt0cmVuZGluZ1Njb3JlEAIaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

#### **Index 8: Meme Reactions (memeId + chatId + userId)**
```
https://console.firebase.google.com/v1/r/project/meme-app-backend/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tZW1lLWFwcC1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tZW1lUmVhY3Rpb25zL2luZGV4ZXMvXxABGgwKCG1lbWVJZBEBGgoKBmNoYXRJZBEBGgwKCHVzZXJJZBEBGgwKCF9fbmFtZV9fEAE
```

### **📋 MANUAL INDEX CREATION (IF LINKS DON'T WORK):**

If the direct links don't work, create these indexes manually in Firebase Console:

#### **Index 1A: chatMessages (ascending)**
- **Collection:** `chatMessages`
- **Fields:**
  - `chatId` (Ascending)
  - `timestamp` (Ascending)

#### **Index 1B: chatMessages (descending)**
- **Collection:** `chatMessages`
- **Fields:**
  - `chatId` (Ascending)
  - `timestamp` (Descending)

#### **Index 2: chatMessages (readBy)**
- **Collection:** `chatMessages`
- **Fields:**
  - `chatId` (Ascending)
  - `readBy` (Array)

#### **Index 3: commentReplies**
- **Collection:** `commentReplies`
- **Fields:**
  - `parentCommentId` (Ascending)
  - `timestamp` (Ascending)

#### **Index 4: follows**
- **Collection:** `follows`
- **Fields:**
  - `followingId` (Ascending)
  - `createdAt` (Descending)

#### **Index 5: chatRooms**
- **Collection:** `chatRooms`
- **Fields:**
  - `participants` (Array)
  - `isActive` (Ascending)
  - `lastActivity` (Descending)

#### **Index 6: userInteractions**
- **Collection:** `userInteractions`
- **Fields:**
  - `userId` (Ascending)
  - `type` (Ascending)
  - `createdAt` (Descending)

#### **Index 7: memes (trending)**
- **Collection:** `memes`
- **Fields:**
  - `trendingScore` (Descending)
  - `createdAt` (Descending)

#### **Index 8: memeReactions**
- **Collection:** `memeReactions`
- **Fields:**
  - `memeId` (Ascending)
  - `chatId` (Ascending)
  - `userId` (Ascending)

## 🎯 **FEATURES ENABLED BY THESE INDEXES:**

### **💬 Chat Features:**
- ✅ **Message ordering** by timestamp in chats
- ✅ **Unread message tracking** with readBy arrays
- ✅ **Chat room filtering** by participants and activity
- ✅ **Emoji reactions** on shared memes

### **👍 Like Features:**
- ✅ **Liked memes history** for users
- ✅ **Trending boost** based on like velocity
- ✅ **User interaction tracking** for achievements

### **🏆 Social Features:**
- ✅ **Follower-based messaging** restrictions
- ✅ **Comment reply threading**
- ✅ **Follow relationship queries**

## 🚀 **DEPLOYMENT CHECKLIST:**

- [ ] Copy Firebase rules from `COMPLETE_FIREBASE_RULES_WITH_LIKES_CHAT.rules`
- [ ] Paste into Firebase Console → Firestore → Rules → Publish
- [ ] Create Index 1 (Chat Messages - timestamp)
- [ ] Create Index 2 (Chat Messages - readBy)
- [ ] Create Index 3 (Comment Replies)
- [ ] Create Index 4 (Follows)
- [ ] Create Index 5 (Chat Rooms)
- [ ] Create Index 6 (User Interactions)
- [ ] Create Index 7 (Memes - trending)
- [ ] Create Index 8 (Meme Reactions)
- [ ] Test all functionality

**After creating all indexes, your Snacx app will have full like and chat functionality!** 🎉
