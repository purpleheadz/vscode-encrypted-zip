# Change Log

All notable changes to the "vscode-encrypted-zip" extension will be documented in this file.

## [0.2.0] - 2025-03-01

### Added
- Configurable password patterns through settings
- Three predefined password patterns:
  - Standard (uppercase/lowercase/numbers/special characters)
  - Alphanumeric only (uppercase/lowercase/numbers)
  - Numeric only (6-digit)
- Password pattern selection UI when creating ZIP files
- Command to access password pattern settings
- GitHub repository badges in README

### Changed
- Improved password generation to support different character sets
- Updated README with new feature documentation

### Fixed
- Fixed test cases for compatibility with the new password system

## [0.1.0] - 2025-02-15

### Added
- Initial release
- Support for creating encrypted ZIP files
- Password generation and clipboard integration
- Context menu and keyboard shortcut support
- Multi-file selection support