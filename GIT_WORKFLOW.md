# Git Workflow Rules

## Important: DO NOT push to ReminiscentStreamingTESTDOMAIN

This project uses a separate GitHub repository. The old remote has been removed.

## Workflow Process

### 1. Local Development First
- All changes are made and tested locally first
- No automatic pushes to GitHub
- Work in progress stays on your local machine

### 2. Before Pushing to Git
**CRITICAL: ALWAYS RUN `npm run build` BEFORE COMMITTING OR PUSHING**

When you explicitly ask to push to git, the following steps will be executed **IN THIS EXACT ORDER**:

1. **Run Build FIRST**: `npm run build`
   - MUST be done BEFORE any commit
   - Ensures the project compiles successfully
   - Catches build-time errors
   - If build fails, FIX ERRORS before proceeding

2. **Fix Type Errors**: 
   - All TypeScript type errors must be resolved
   - Build must complete without errors
   - NO COMMITS until build passes

3. **Create Comprehensive Commit Messages**:
   - Detailed commit messages explaining:
     - What changes were made
     - Why changes were made
     - Any bug fixes
     - Any new features
     - Any refactoring
   - Each commit should be descriptive and self-documenting

4. **Push to GitHub**:
   - Only after successful build and type checking
   - Push to the new repository (to be created)

5. **Automatic Deployment**:
   - After pushing, Vercel will automatically deploy
   - No manual deployment steps needed

## Rules Summary

✅ **DO:**
- Work locally first
- Test changes before committing
- Run `npm run build` before pushing
- Fix all type errors before pushing
- Create detailed commit messages
- Only push when explicitly asked

❌ **DON'T:**
- **NEVER commit or push without running `npm run build` first**
- Push automatically without permission
- Push to ReminiscentStreamingTESTDOMAIN
- Push with type errors
- Push without running build first
- Create vague commit messages
- Commit code that doesn't compile

## Setting Up New Repository

1. Create a new repository on GitHub (https://github.com/ReminiscentBot)
2. Name it appropriately (e.g., `trendsignite-website`)
3. Do NOT initialize with README, .gitignore, or license (we already have these)
4. Then run:
   ```bash
   git remote add origin https://github.com/ReminiscentBot/YOUR-REPO-NAME.git
   ```
