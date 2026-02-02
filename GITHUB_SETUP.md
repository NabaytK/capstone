# How to Push This Project to GitHub

## Step-by-Step Instructions

### 1. Extract the ZIP File
- Download the ZIP file from Claude
- Extract it to a folder on your computer
- Open that folder in Terminal (or Command Prompt on Windows)

### 2. Initialize Git Repository
In terminal, type these commands one by one:

```bash
git init
```

### 3. Add All Files
```bash
git add .
```

### 4. Make Your First Commit
```bash
git commit -m "Initial commit - Crypto Portfolio Tracker"
```

### 5. Connect to GitHub
First, create a new repository on GitHub.com (don't add README or .gitignore, just create empty repo)

Then connect your local project to GitHub:
```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
```

Replace `YOUR-USERNAME` with your GitHub username and `YOUR-REPO-NAME` with your repository name.

### 6. Push to GitHub
```bash
git branch -M main
git push -u origin main
```

### Done! 🎉
Your project is now on GitHub!

## Future Updates

When you make changes to your code, use these commands:

```bash
git add .
git commit -m "Description of what you changed"
git push
```

## Troubleshooting

**Problem**: "git is not recognized"  
**Solution**: You need to install Git. Download from https://git-scm.com/

**Problem**: GitHub asks for password  
**Solution**: You need to use a Personal Access Token instead of password. Create one in GitHub Settings → Developer Settings → Personal Access Tokens

**Problem**: Permission denied  
**Solution**: Make sure you're the owner of the GitHub repository or have write access
