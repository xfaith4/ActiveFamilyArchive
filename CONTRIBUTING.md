# Contributing to Living Family Archive

Thank you for your interest in contributing! This is a private family project, but improvements and bug fixes are welcome.

## How to Contribute

### Reporting Issues

If you find a bug or have a suggestion:

1. Check if the issue already exists in the [Issues](../../issues) page
2. If not, create a new issue with:
   - Clear description of the problem or suggestion
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS information

### Suggesting Enhancements

For feature requests:

1. Describe the feature and its use case
2. Explain how it would benefit family members
3. Provide examples or mockups if possible

### Code Contributions

If you want to contribute code:

1. **Fork the repository**
2. **Create a branch** for your feature:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following the coding standards below
4. **Test thoroughly** - ensure nothing breaks
5. **Commit your changes** with clear messages:

   ```bash
   git commit -m "Add feature: description"
   ```

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** with:
   - Description of changes
   - Any related issues
   - Screenshots of UI changes

## Coding Standards

### JavaScript

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use async/await for asynchronous code
- Add comments for complex logic
- Keep functions small and focused

### CSS

- Follow existing naming conventions
- Use CSS variables for colors and common values
- Keep selectors specific but not overly complex
- Ensure responsive design works on mobile

### HTML

- Use semantic HTML elements
- Keep accessibility in mind (alt text, ARIA labels)
- Maintain consistent indentation

## Testing

Before submitting:

1. Test locally with `npm run dev`
2. Build and test with `npm run build && npm run preview`
3. Test on multiple browsers (Chrome, Firefox, Safari)
4. Test on mobile devices if possible
5. Verify all features still work:
   - Authentication
   - Search
   - Photo gallery
   - Admin panel (if applicable)

## Release Flow

This repository uses a staged promotion model:

1. Feature and bug-fix branches open PRs into `staging`
2. `staging` auto-deploys to the staging Firebase project
3. After staging verification, open a PR from `staging` into `main`
4. `main` deploys production only after that release PR is merged

Do not open feature PRs directly into `main`. The GitHub workflow `Enforce Release Flow` blocks those PRs automatically.

For GitHub branch protection, configure `main` to:

- Require a pull request before merging
- Require the `Enforce Release Flow` check to pass
- Restrict direct pushes

## Security

⚠️ **Important Security Guidelines**:

- Never commit Firebase credentials
- Never commit `.env` files with real values
- Always use environment variables for sensitive data
- Review Firestore rules carefully
- Don't expose admin functionality to regular users

## Documentation

When adding features:

- Update README.md if needed
- Add setup steps to project-docs/operations/SETUP_GUIDE.md
- Update project-docs/operations/TROUBLESHOOTING.md for known issues
- Add code comments for complex logic

## Questions?

Feel free to:

- Open an issue for questions
- Start a discussion in the Discussions tab
- Contact the repository owner

## License

By contributing, you agree that your contributions will be used within this family project.

---

Thank you for helping make this family tree application better! 🌳
