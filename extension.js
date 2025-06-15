const vscode = require('vscode');
const archiver = require('archiver');
const archiverZipEncrypted = require('archiver-zip-encrypted');
const {
  createFromExplorer,
  createFromActiveFile,
  createFromDragAndDrop,
  createAndSendViaOutlook,
  configurePatterns,
  createEncryptedZip,
  createEncryptedZipAndSend
} = require('./src/commands');
const { generateRandomPassword } = require('./src/password');
const { sendViaOutlook } = require('./src/outlook');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Encrypted ZIP Creator is now active');

  archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

  let createFromExplorerCmd = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createEncryptedZip',
    createFromExplorer
  );

  let createFromEditorCmd = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createFromActiveFile',
    createFromActiveFile
  );

  let createFromDragAndDropCmd = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createFromDragDrop',
    createFromDragAndDrop
  );

  let configurePatternsCmd = vscode.commands.registerCommand(
    'vscode-encrypted-zip.configurePasswordPatterns',
    configurePatterns
  );

  let createAndSendViaOutlookCmd = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createAndSendViaOutlook',
    createAndSendViaOutlook
  );

  context.subscriptions.push(createFromExplorerCmd);
  context.subscriptions.push(createFromEditorCmd);
  context.subscriptions.push(createFromDragAndDropCmd);
  context.subscriptions.push(configurePatternsCmd);
  context.subscriptions.push(createAndSendViaOutlookCmd);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
  generateRandomPassword,
  createEncryptedZip,
  createEncryptedZipAndSend,
  sendViaOutlook
};