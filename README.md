# 🏋️ The Den - Trial Management System

A mobile-first React app for managing gym trial signups and converting trials to memberships.

## ✨ Features

- **📱 Mobile-First Design** - Optimized for phone use at the gym
- **👥 Two-User System** - Secure access for Sergio (manager) and gym owner
- **⚡ Real-Time Sync** - Changes sync instantly across devices via Supabase
- **📊 Three Data Entry Methods**
  - Manual typing (✏️ Type mode)
  - Photo scan of forms (📷 Scan mode)
  - Bulk CSV import (for historical data)
- **🔍 Smart Filtering** - Priority (ending/active), Active only, or All
- **📅 Auto Trial Dates** - Calculates 3 weekday trial dates (skips weekends)
- **✓ SMS Consent Tracking** - Prevents accidental spam texting
- **🌙 Dark Mode Toggle** - Eye-friendly for any lighting

## 🚀 Quick Start (15 minutes)

### 1. Set Up Supabase (5 min)
1. Go to https://supabase.com → Sign up
2. Click "New Project"
3. **Name:** "The Den Training Center" (or your name)
4. **Create password** (save it!)
5. **Wait 2 minutes** for initialization

### 2. Get Your Keys (2 min)
1. Go to **Settings → API**
2. Copy **Project URL** (starts with https://...)
3. Copy **anon public key** (the long one)
4. Save both to a safe place

### 3. Create Database Tables (2 min)
1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Paste this SQL:
```sql
-- Create trials table
CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  student_email TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  is_minor BOOLEAN DEFAULT false,
  date_signed DATE,
  trial_start_date DATE,
  trial_dates TEXT,
  status TEXT DEFAULT 'trial_scheduled',
  sms_consent BOOLEAN DEFAULT false,
  notes TEXT,
  form_photo_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user'
);

-- Create messages table (for Phase 2)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID REFERENCES trials(id),
  message_type TEXT,
  content TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

-- Create activity_log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT,
  trial_id UUID REFERENCES trials(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own trials" ON trials
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own trials" ON trials
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own trials" ON trials
  FOR UPDATE USING (auth.uid() = owner_id);
```
4. Click **"Run"** → Wait for success ✓

### 4. Create Storage Bucket (1 min)
1. Go to **Storage** tab
2. Click **"Create new bucket"**
3. **Name:** `trial_forms` (exactly this)
4. **Public** → Create bucket

### 5. Invite Users (1 min)
1. Go to **Authentication → Users**
2. Click **"Invite"**
3. Add:
   - Sergio's email
   - Gym owner's email
4. They'll get invite emails with password reset links

### 6. Deploy to Netlify (4 min)

#### Option A: GitHub + Auto-Deploy (Recommended)
1. This repo is already: `github.com/Insidetripz/the-den-trial-system`

2. Go to Netlify: https://netlify.com
   - Sign up (free tier is perfect)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub, select `Insidetripz/the-den-trial-system`

3. Add environment variables:
   - Click "Site settings" → "Build & deploy" → "Environment"
   - Add two variables:
     - `REACT_APP_SUPABASE_URL` = (your Supabase URL)
     - `REACT_APP_SUPABASE_ANON_KEY` = (your Supabase anon key)

4. Netlify auto-deploys! Wait 2-3 minutes.
   - Your live URL: `https://thedentraining.netlify.app`

### 7. Test on Your Phone
1. Open phone browser
2. Go to your Netlify URL
3. Log in with your email
4. Tap "+ New Trial" → Add a test person
5. See it update in real-time ✓

## 📂 File Structure

```
the-den-trial-system/
├── package.json              # Dependencies and scripts
├── .gitignore                # Files to ignore in Git
├── README.md                 # This file
├── public/
│   └── index.html            # HTML shell
└── src/
    ├── index.js              # React entry point
    ├── index.css             # Global styles
    ├── App.jsx               # Main app component
    ├── App.css               # Design system & colors
    └── components/
        ├── LoginScreen.jsx   # Email/password auth
        ├── Dashboard.jsx     # Desktop view (tables)
        ├── MobileViewEnhanced.jsx  # Mobile view (cards)
        ├── QuickIntakeForm.jsx     # Manual + photo entry
        └── BulkImport.jsx    # CSV bulk upload
```

## 🎯 How It Works

### Desktop (Owner)
- **Dashboard.jsx** shows:
  - Stats cards (starting, active, ending, joined, not joined)
  - Trial table with all data
  - Quick action buttons
  - See real-time updates from Sergio's phone

### Mobile (Sergio at Gym)
- **MobileViewEnhanced.jsx** shows:
  - Priority tab (ending today + active)
  - Search by name or phone
  - Big action buttons (✓ Joined | ✗ Did Not Join)
  - Owner's phone updates instantly

### Data Entry
- **QuickIntakeForm.jsx** has two modes:
  - ✏️ Type: Manual form entry
  - 📷 Scan: Take photo of form, then manually enter name/phone/email
- **BulkImport.jsx**: Upload CSV with historical data

## 🔑 Environment Variables

**Never put these in Git!** Store them in Netlify only:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...very_long_string
```

## 📊 Database Schema

### trials table
- `id` (UUID) - Primary key
- `student_name` (text) - Required
- `student_phone` (text) - Required
- `student_email` (text) - Optional
- `parent_name` (text) - For minors
- `parent_phone` (text) - For minors
- `is_minor` (boolean) - Default false
- `date_signed` (date) - Signup date
- `trial_start_date` (date) - Trial start (usually same day)
- `trial_dates` (text) - "Mon, Aug 5 - Wed, Aug 7" (skips weekends)
- `status` (text) - 'trial_scheduled', 'joined', 'not_joined'
- `sms_consent` (boolean) - Can we text them?
- `notes` (text) - Internal notes
- `form_photo_url` (text) - Photo of signed form
- `created_at` (timestamp) - Created
- `updated_at` (timestamp) - Last updated
- `owner_id` (UUID) - Who owns this record

## 🔄 Real-Time Sync

When Sergio marks someone "Joined":
1. MobileView updates card instantly
2. Supabase notifies all subscribed clients
3. Owner's dashboard updates in <1 second
4. No refresh needed - it just happens

Uses Supabase real-time subscriptions (PostgreSQL listen/notify).

## 🔒 Security

- ✅ Only two people can log in (Sergio + owner)
- ✅ Passwords hashed by Supabase Auth
- ✅ All data encrypted in transit (HTTPS)
- ✅ Row-level security - users only see their own data
- ✅ Phone auto-logs out after 15 min idle
- ✅ Activity log for audit trail

## 📱 Mobile Features

- **One-handed use** - Everything within thumb reach
- **44px+ touch targets** - Easy to tap even with sweaty hands
- **High contrast** - Black/white/blue for bright gym lighting
- **No scrolling** - All info visible without scrolling
- **Works offline** - Phase 2 feature

## 🔧 Development

### Install dependencies:
```bash
npm install
```

### Run locally:
```bash
npm start
```

Opens at http://localhost:3000

### Build for production:
```bash
npm run build
```

Creates `build/` folder ready for Netlify.

## ✅ Post-Deploy Checklist

- [ ] Can log in with email
- [ ] "+ New Trial" form works
- [ ] Can add a test person (manual mode)
- [ ] Can take/upload photo (scan mode)
- [ ] Status buttons (✓/✗) work
- [ ] Card updates instantly
- [ ] Search by name works
- [ ] Tabs switch (Priority/Active/All)
- [ ] Works on phone (bookmark it)
- [ ] Owner sees your updates on desktop
- [ ] Dark mode toggle works (🌙 button)

## 🎯 First Day Workflow

**Monday morning at gym:**
1. Open phone → go to bookmarked URL
2. Someone walks in for trial
3. Tap "+ New Trial"
4. Type their name, phone, email
5. Tap "✓ SMS Consent" if they agreed
6. Tap "+ Add Trial"
7. They're now in the system, owner sees it instantly

**Friday (3 days later):**
1. Person finishes trial
2. You tap search → find them
3. Ask "Want to join?"
4. Yes → Tap "✓ Joined"
5. Owner sees it immediately on their phone/desktop
6. Member is marked as joined

**That's it.**

## 🆘 Troubleshooting

**"Can't log in"**
- Check Supabase → Authentication → Users (make sure you're invited)
- Check email spelling
- Try clearing browser cache

**"Database error"**
- Go to Supabase → SQL Editor → run setup SQL again
- Make sure all tables exist (Users, trials, messages, activity_log)

**"App won't load"**
- Check Netlify deploy is "Published"
- Check environment variables are set in Netlify
- Check Supabase URL/key are correct

**"Photo upload fails"**
- Make sure `trial_forms` bucket exists in Supabase Storage
- Make sure bucket is set to "Public"

**"Search doesn't work"**
- Try full name instead of partial
- Phone number must match exactly (include dashes)

## 📞 Support

All the code is here. No external dependencies or APIs except Supabase (for database and auth).

The app is built with:
- React 18
- Supabase (@supabase/supabase-js)
- date-fns (date calculations)
- CSS-in-JS for styling (no extra CSS framework)

---

Built for The Den Training Center. Enjoy! 🏋️