# Encrypted ZIP Creator for VS Code

[![GitHub](https://img.shields.io/github/license/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/issues)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/releases)
[![GitHub stars](https://img.shields.io/github/stars/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/stargazers)
[![Build Status](https://github.com/purpleheadz/vscode-encrypted-zip/actions/workflows/cicd.yaml/badge.svg)](https://github.com/purpleheadz/vscode-encrypted-zip/actions)
[![Architecture Documentation](https://img.shields.io/badge/docs-architecture-blue)](https://github.com/purpleheadz/vscode-encrypted-zip/blob/main/ARCHITECTURE.md)

Create encrypted ZIP files from VS Code with a single action. Automatically generates passwords and copies them to your clipboard for convenience.
This tool reduces the hassle of the infamous PPAP workflow and includes seamless Outlook integration.

## Features

- **Encrypted ZIP Creation**: Create password-protected ZIP archives from files or folders with right-click
- **Smart Password Generation**: Auto-generate secure passwords and copy to clipboard
- **Flexible Password Options**: Choose from multiple password patterns or use custom passwords
- **Outlook Integration**: Automatically open Outlook with ZIP file attached for instant email sending
- **Modular Architecture**: Clean, maintainable codebase with separated concerns
- **Multiple Creation Methods**:
  - From Explorer context menu
  - From active file in editor
  - From file picker dialog
  - With automatic Outlook sending
- **Customizable Settings**: Configure password patterns via VS Code settings
- **Keyboard Shortcuts**: Quick access via Ctrl+Alt+Z / Cmd+Alt+Z

## Installation

### From VSIX Package
1. Clone the repository
2. Run the following commands:
```
cd vscode-encrypted-zip
npm install
npm run vsce:package
```
3. Install the generated .vsix file via "Install Extension VSIX" option

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Usage

### Basic ZIP Creation
1. Right-click on a file or folder in VS Code Explorer
2. Select "暗号化ZIPの作成" (Create Encrypted ZIP)
3. Choose a password pattern or enter custom password
4. Select destination for the ZIP file
5. Optionally send via Outlook

### Outlook Integration
1. Right-click on files/folders and select "ZIPファイル作成してOutlook送付"
2. Choose password pattern and confirm
3. Select ZIP destination
4. Outlook automatically opens with file attached and password in clipboard

## Requirements

- VS Code 1.60.0 or higher

## Commands

- `vscode-encrypted-zip.createEncryptedZip`: Create encrypted ZIP from Explorer
- `vscode-encrypted-zip.createFromActiveFile`: Create encrypted ZIP from current file
- `vscode-encrypted-zip.createFromDragDrop`: Create encrypted ZIP from file picker
- `vscode-encrypted-zip.createAndSendViaOutlook`: Create ZIP and send via Outlook
- `vscode-encrypted-zip.configurePasswordPatterns`: Open password pattern settings

## Development

### Project Structure
The codebase follows a modular architecture for maintainability:

```
src/
├── commands.js      # Command registration and execution
├── password.js      # Password generation and pattern management
├── fileSelection.js # File selection logic and resource handling
├── zipCreator.js    # ZIP creation and archive processing
├── outlook.js       # Outlook integration functionality
└── utils.js         # Shared utility functions
```

For a detailed overview of the project architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

### Build Commands
- `npm run vsce:package` - Build VSIX extension package
- `npm run vsce:publish` - Publish extension to marketplace

### Lint/Test Commands
- `npm run lint` - Run ESLint on extension.js
- `npm run test` - Run all tests (6 test cases covering core functionality)

## Release Notes

### 0.3.0 (Latest)
- **Major Code Refactoring**: Modular architecture for improved maintainability
- **Outlook Integration**: Seamless email sending with ZIP attachment
- **Enhanced Test Suite**: Comprehensive testing with 6 test cases
- **Bug Fixes**: Resolved archiver format registration conflicts
- **Developer Experience**: Cleaner code structure and better documentation

### 0.2.0
- Added configurable password patterns
- Added settings to customize password patterns
- Added password pattern selection UI
- Added command to access password pattern settings

### 0.1.0
- Initial release
- Support for creating encrypted ZIP files
- Password generation and clipboard integration
- Context menu and keyboard shortcut support
