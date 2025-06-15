# Change Log

All notable changes to the "vscode-encrypted-zip" extension will be documented in this file.

## [0.3.0] - 2025-06-15

### Added
- **Outlook Integration**: New command to create ZIP and automatically send via Outlook
- **Modular Architecture**: Refactored codebase into focused modules:
  - `src/commands.js` - Command registration and execution logic
  - `src/password.js` - Password generation and pattern management
  - `src/fileSelection.js` - File selection and resource handling
  - `src/zipCreator.js` - ZIP creation and archive processing
  - `src/outlook.js` - Outlook integration functionality
  - `src/utils.js` - Shared utility functions
- **Enhanced Test Coverage**: Comprehensive test suite with 6 test cases covering core functionality
- **Developer Documentation**: Improved project structure documentation in README

### Changed
- **Code Organization**: Split monolithic extension.js into modular components for better maintainability
- **Test Framework**: Updated tests to work with modular architecture
- **Error Handling**: Improved error handling across all modules

### Fixed
- **Test Suite Issues**: Resolved archiver format registration conflicts in test environment
- **Deprecated API**: Replaced `fs.rmdirSync` with `fs.rmSync` for Node.js compatibility
- **Code Quality**: Enhanced code maintainability and reduced technical debt

### Technical Improvements
- Reduced extension.js from 752 lines to 65 lines (91% reduction)
- Improved separation of concerns with dedicated modules
- Better error handling and logging throughout the codebase
- Enhanced test reliability and coverage

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