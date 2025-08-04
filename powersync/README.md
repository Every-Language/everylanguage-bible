# PowerSync Setup for EveryLanguage Bible App

This directory contains the PowerSync configuration for syncing Bible data between your Supabase database and React Native app.

## 📁 Directory Structure

```
powersync/
├── sync-rules.yaml    # PowerSync sync rules defining what data to sync
└── README.md         # This file
```

## 🔄 Sync Rules

The `sync-rules.yaml` file defines which tables and data are synchronized to client devices:

- **bible_versions**: All Bible version metadata
- **books**: All books with their Bible version relationships
- **chapters**: All chapters with their book relationships
- **verses**: All verses with their chapter relationships

Currently using a global bucket strategy, meaning all Bible content is available to all users. This is appropriate for public Bible content.

## 🚀 CI/CD Deployment

### Workflow Triggers

The GitHub Actions workflow (`.github/workflows/deploy-powersync-rules.yml`) deploys sync rules automatically:

- **Development**: Deploys on push to `develop` branch
- **Production**: Deploys on push to `main` branch
- **Manual**: Use workflow dispatch to deploy to specific environments

### Required GitHub Secrets

Add these secrets to your GitHub repository:

#### Required Secrets

| Secret Name                  | Description                          | How to Find                                                  |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `POWERSYNC_API_TOKEN`        | Your PowerSync Personal Access Token | PowerSync Dashboard → Account Settings → API Tokens          |
| `POWERSYNC_PROJECT_ID`       | Your PowerSync Project ID            | PowerSync Dashboard → Projects → Copy Project ID             |
| `POWERSYNC_DEV_INSTANCE_ID`  | Development PowerSync Instance ID    | PowerSync Dashboard → Dev Instance → Settings → Instance ID  |
| `POWERSYNC_PROD_INSTANCE_ID` | Production PowerSync Instance ID     | PowerSync Dashboard → Prod Instance → Settings → Instance ID |

### How to Set Up Secrets

1. **Get PowerSync API Token**:
   - Go to [PowerSync Dashboard](https://powersync.com/dashboard)
   - Navigate to Account Settings → API Tokens
   - Click "Create Personal Access Token"
   - Copy the token (starts with `ps_pat_`)

2. **Get Project and Instance IDs**:
   - In PowerSync Dashboard, go to your project
   - Copy the Project ID from the URL or project settings
   - Go to your dev instance → Settings → Copy Instance ID
   - Go to your prod instance → Settings → Copy Instance ID

3. **Add to GitHub**:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each secret with the exact names listed above

## 🧪 Testing the CI/CD Setup

### Method 1: Quick Test via Minor Change

1. Make a small change to `powersync/sync-rules.yaml`:

   ```yaml
   # Add a comment like this
   # Updated on: 2024-01-XX
   ```

2. Commit and push to `develop` branch:

   ```bash
   git add powersync/sync-rules.yaml
   git commit -m "test: trigger PowerSync deployment"
   git push origin develop
   ```

3. Watch the GitHub Actions:
   - Go to GitHub Actions tab
   - Look for "Deploy PowerSync Sync Rules" workflow
   - Should show validation + dev deployment

### Method 2: Manual Workflow Trigger

1. Go to GitHub Actions tab
2. Select "Deploy PowerSync Sync Rules" workflow
3. Click "Run workflow"
4. Choose environment: `dev`, `prod`, or `both`
5. Click "Run workflow" button

### Method 3: Local CLI Testing

```bash
# Install PowerSync CLI
npm install -g @powersync/cli

# Initialize CLI with your API token
npx powersync init

# Test validation locally
npx powersync validate-sync-rules powersync/sync-rules.yaml \
  --project-id YOUR_PROJECT_ID \
  --instance-id YOUR_DEV_INSTANCE_ID

# Test deployment locally (optional)
npx powersync deploy-sync-rules powersync/sync-rules.yaml \
  --project-id YOUR_PROJECT_ID \
  --instance-id YOUR_DEV_INSTANCE_ID
```

## 📋 Deployment Process

### Automatic Deployment

1. **Development**:
   - Push changes to `develop` branch
   - Sync rules deploy to dev PowerSync instance

2. **Production**:
   - Push changes to `main` branch
   - Sync rules deploy to prod PowerSync instance

### Deployment Steps

Each deployment:

1. ✅ **Validates** sync rules syntax
2. ✅ **Tests** rules against PowerSync instance
3. 🚀 **Deploys** rules to target environment
4. 🔍 **Verifies** deployment success
5. 📋 **Reports** status in GitHub

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid API token"**
   - Check `POWERSYNC_API_TOKEN` secret is correct
   - Ensure token hasn't expired
   - Token should start with `ps_pat_`

2. **"Project/Instance not found"**
   - Verify `POWERSYNC_PROJECT_ID`, `POWERSYNC_DEV_INSTANCE_ID`, `POWERSYNC_PROD_INSTANCE_ID`
   - Check you have access to the PowerSync project
   - Ensure instance IDs are from the correct project

3. **"Sync rules validation failed"**
   - Check YAML syntax: `python -c "import yaml; yaml.safe_load(open('powersync/sync-rules.yaml'))"`
   - Ensure table names match your database schema
   - Verify column references are correct

4. **Workflow errors**
   - Check GitHub Actions logs for detailed error messages
   - Ensure all required secrets are set
   - Verify secret names match exactly (case-sensitive)

### Getting Help

- [PowerSync Documentation](https://docs.powersync.com)
- [PowerSync Discord](https://discord.gg/powersync)
- Check GitHub Actions logs for detailed error messages

## 📊 Expected Workflow Behavior

### When you push to `develop`:

- ✅ Validates sync rules
- 🚀 Deploys to development instance
- 📋 Shows success/failure status

### When you push to `main`:

- ✅ Validates sync rules
- 🚀 Deploys to development instance first
- 🚀 Then deploys to production instance
- 📋 Shows success/failure status

## 🏗️ Future Enhancements

Consider these improvements as your app grows:

1. **User-specific sync rules**: Filter data based on user permissions
2. **Selective sync**: Allow users to choose which Bible versions to sync
3. **Priority buckets**: Sync frequently used content first
4. **Incremental updates**: Optimize for large Bible content datasets

## 📚 PowerSync Resources

- [Sync Rules Documentation](https://docs.powersync.com/usage/sync-rules)
- [CLI Reference](https://docs.powersync.com/usage/tools/cli)
- [React Native Integration](https://docs.powersync.com/client-sdk-references/react-native-and-expo)
- [Supabase Integration](https://docs.powersync.com/integration-guides/supabase-+-powersync)
