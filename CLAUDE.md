# vscode-encrypted-zip Build/Test Commands

## Build Commands
- `npm run vsce:package` - Build VSIX extension package
- `npm run vsce:publish` - Publish extension to marketplace

## Lint/Test Commands
- `npm run lint` - Run ESLint on extension.js and all src modules
- `npm run test` - Run all tests
- `npx mocha ./test/extension.test.js -g "パスワード生成のテスト"` - Run a specific test by name

## Code Style Guidelines

### Formatting & Structure
- Use modern JavaScript (ECMAScript 2022)
- Use CommonJS module system
- Include JSDoc comments for functions with parameter/return documentation
- Indent with 2 spaces

### Naming Conventions
- Use camelCase for variables and functions
- Use descriptive, self-documenting variable names
- JSDoc documentation for all exported functions

### Error Handling
- Use try/catch blocks for error handling
- Display user-friendly error messages via vscode.window.showErrorMessage
- Log errors with appropriate context

### Architecture
- Follow VS Code extension patterns with activate/deactivate exports
- Use registerCommand for extension commands
- Export functions needed for testing