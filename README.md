# Encrypted ZIP Creator for VS Code

[![GitHub](https://img.shields.io/github/license/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/issues)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/releases)
[![GitHub stars](https://img.shields.io/github/stars/purpleheadz/vscode-encrypted-zip)](https://github.com/purpleheadz/vscode-encrypted-zip/stargazers)
[![Build Status](https://img.shields.io/github/actions/workflow/status/purpleheadz/vscode-encrypted-zip/ci.yml?branch=main)](https://github.com/purpleheadz/vscode-encrypted-zip/actions)

Create encrypted ZIP files from VS Code with a single action. Automatically generates passwords and copies them to your clipboard for convenience.
This tool reduces the hassle of the infamous PPAP workflow.

## Features

- Create encrypted ZIP archives from files or folders with right-click
- Auto-generate secure passwords and copy to clipboard
- Choose from multiple password patterns (standard, alphanumeric, numeric)
- Configure custom password patterns via settings
- Option to use your own custom password
- Context menu integration in Explorer and Editor
- Keyboard shortcut support (Ctrl+Alt+Z / Cmd+Alt+Z)
- Multiple ways to create encrypted archives:
  - From Explorer context menu
  - From active file
  - From file picker dialog

## Installation

1. Clone the repository
2. Run the following commands:
```
cd vscode-encrypted-zip
npm install
npm run vsce:package
```
3. Install the generated .vsix file via "Install Extension VSIX" option

## Usage

1. Right-click on a file or folder in VS Code Explorer
2. Select "暗号化ZIPの作成" (Create Encrypted ZIP)
3. Choose to use auto-generated password (copied to clipboard) or enter your own
4. Select destination for the ZIP file

## Requirements

- VS Code 1.60.0 or higher

## Commands

- `vscode-encrypted-zip.createEncryptedZip`: Create encrypted ZIP from Explorer
- `vscode-encrypted-zip.createFromActiveFile`: Create encrypted ZIP from current file
- `vscode-encrypted-zip.createFromDragDrop`: Create encrypted ZIP from file picker
- `vscode-encrypted-zip.configurePasswordPatterns`: Open password pattern settings

## Development

### Build Commands
- `npm run vsce:package` - Build VSIX extension package
- `npm run vsce:publish` - Publish extension to marketplace

### Lint/Test Commands
- `npm run lint` - Run ESLint on extension.js
- `npm run test` - Run all tests

## Release Notes

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
