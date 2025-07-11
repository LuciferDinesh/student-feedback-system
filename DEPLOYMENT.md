# Vercel Deployment Guide

## Prerequisites
1. GitHub account
2. Vercel account (can sign up with GitHub)
3. Google Sheets API credentials

## Step 1: Push to GitHub

1. Initialize git repository (if not done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub

3. Push your code:
```bash
git remote add origin https://github.com/yourusername/student-feedback-system.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Step 3: Add Environment Variables

In Vercel dashboard:

1. Go to Project Settings > Environment Variables
2. Add these variables:

```
GOOGLE_CLIENT_EMAIL = your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID = your-spreadsheet-id
NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
```

⚠️ **Important**: For `GOOGLE_PRIVATE_KEY`, make sure to:
- Keep the quotes around the entire key
- Keep the `\n` characters for line breaks
- Include the BEGIN and END lines

## Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at `https://your-app-name.vercel.app`

## Google Sheets Setup

Make sure your Google Sheets are properly configured:

1. **Admin Config Sheet**: Name it "Admin Config"
2. **Response Sheets**: Will be created automatically
3. **Service Account**: Has access to your spreadsheet

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check the build logs in Vercel dashboard
2. **Environment Variables**: Ensure they're properly formatted
3. **Google Sheets Access**: Verify service account permissions

### Useful Commands:

```bash
# Test build locally
npm run build

# Start production server locally
npm start

# Check for lint errors
npm run lint
```

## Auto-Deploy

Once connected to GitHub, Vercel will automatically deploy:
- On every push to main branch
- Preview deployments for pull requests

## Custom Domain (Optional)

1. In Vercel dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS settings as instructed
