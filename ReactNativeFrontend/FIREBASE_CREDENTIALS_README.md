# Firebase Credentials Setup

## ⚠️ IMPORTANT SECURITY NOTICE

The Firebase service account credentials file is **NOT** included in this repository for security reasons.

## Setup Instructions

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file as:
   - Filename: `twittetec-firebase-adminsdk-fbsvc-XXXXX.json` (or similar)
   - Location: `ReactNativeFrontend/` directory

## File Pattern

The file should follow this pattern and will be automatically ignored by git:
- `**/*firebase-adminsdk*.json`

## Never Commit Credentials!

If you accidentally commit credentials:
1. **Immediately rotate/regenerate them** in Firebase Console
2. Remove them from git history
3. Ensure they're in `.gitignore`

## Template

See `firebase-service-account.example.json` for the expected file structure.
