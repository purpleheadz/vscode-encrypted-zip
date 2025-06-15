const vscode = require('vscode');
const { getFilePathsForCommand, getActiveEditorFilePath, showFileSelectionDialog } = require('./fileSelection');
const { selectPasswordPattern, inputCustomPassword, generateRandomPassword } = require('./password');
const { selectZipSaveLocation, createEncryptedZipFile } = require('./zipCreator');
const { showOutlookOption, autoSendViaOutlook } = require('./outlook');
const { copyToClipboard } = require('./utils');

/**
 * パスワード処理の共通ロジック
 * @param {object} selectedPattern 選択されたパスワードパターン
 * @returns {Promise<string|null>} 最終的なパスワードまたはnull
 */
async function handlePasswordSelection(selectedPattern) {
  if (!selectedPattern) {
    vscode.window.showInformationMessage('暗号化ZIPの作成をキャンセルしました');
    return null;
  }
  
  let finalPassword;
  
  if (selectedPattern.index === -1) {
    const customPassword = await inputCustomPassword();
    if (!customPassword) {
      vscode.window.showInformationMessage('パスワードが入力されなかったため、処理を中止しました');
      return null;
    }
    finalPassword = customPassword;
  } else {
    const config = vscode.workspace.getConfiguration('encryptedZip');
    const passwordPatterns = config.get('passwordPatterns', []);
    const pattern = passwordPatterns[selectedPattern.index];
    const password = generateRandomPassword(pattern);
    
    await copyToClipboard(password);
    
    const options = ['このパスワードを使用', 'キャンセル'];
    const selection = await vscode.window.showInformationMessage(
      `生成されたパスワード「${password}」がクリップボードにコピーされました。`,
      ...options
    );
    
    if (selection !== 'このパスワードを使用') {
      vscode.window.showInformationMessage('暗号化ZIPの作成をキャンセルしました');
      return null;
    }
    
    finalPassword = password;
  }
  
  return finalPassword;
}

/**
 * 暗号化ZIPファイルを作成する
 * @param {string[]} filePaths 圧縮するファイルパスの配列
 * @returns {Promise<void>}
 */
async function createEncryptedZip(filePaths) {
  const selectedPattern = await selectPasswordPattern();
  const finalPassword = await handlePasswordSelection(selectedPattern);
  
  if (!finalPassword) return;
  
  const saveUri = await selectZipSaveLocation(filePaths);
  if (!saveUri) {
    vscode.window.showInformationMessage('保存先が選択されなかったため、処理を中止しました');
    return;
  }
  
  try {
    await createEncryptedZipFile(filePaths, finalPassword, saveUri, showOutlookOption);
  } catch (error) {
    vscode.window.showErrorMessage(`エラーが発生しました: ${error.message}`);
  }
}

/**
 * 暗号化ZIPファイルを作成してOutlookで送信する
 * @param {string[]} filePaths 圧縮するファイルパスの配列
 * @returns {Promise<void>}
 */
async function createEncryptedZipAndSend(filePaths) {
  const selectedPattern = await selectPasswordPattern('パスワードのパターンを選択してください (Outlook送信用)');
  const finalPassword = await handlePasswordSelection(selectedPattern);
  
  if (!finalPassword) return;
  
  const saveUri = await selectZipSaveLocation(filePaths);
  if (!saveUri) {
    vscode.window.showInformationMessage('保存先が選択されなかったため、処理を中止しました');
    return;
  }
  
  try {
    await createEncryptedZipFile(filePaths, finalPassword, saveUri, autoSendViaOutlook);
  } catch (error) {
    vscode.window.showErrorMessage(`エラーが発生しました: ${error.message}`);
  }
}

/**
 * エクスプローラービューからのファイル/フォルダ選択用コマンド
 * @param {object} resource メインリソース
 * @param {object[]} selectedResources 選択されたリソース配列
 * @returns {Promise<void>}
 */
async function createFromExplorer(resource, selectedResources) {
  console.log('コマンド実行: vscode-encrypted-zip.createEncryptedZip');
  
  const filePaths = await getFilePathsForCommand(resource, selectedResources);
  
  if (filePaths.length === 0) {
    vscode.window.showInformationMessage('ファイルまたはフォルダを選択してください');
    return;
  }
  
  await createEncryptedZip(filePaths);
}

/**
 * エディタからの選択用コマンド
 * @returns {Promise<void>}
 */
async function createFromActiveFile() {
  const filePath = getActiveEditorFilePath();
  if (!filePath) {
    vscode.window.showInformationMessage('アクティブなエディタがありません');
    return;
  }
  
  await createEncryptedZip([filePath]);
}

/**
 * ドラッグ＆ドロップのエミュレーション用コマンド
 * @returns {Promise<void>}
 */
async function createFromDragAndDrop() {
  const filePaths = await showFileSelectionDialog();
  
  if (filePaths.length > 0) {
    await createEncryptedZip(filePaths);
  }
}

/**
 * ZIPファイル作成してOutlook送付コマンド
 * @param {object} resource メインリソース
 * @param {object[]} selectedResources 選択されたリソース配列
 * @returns {Promise<void>}
 */
async function createAndSendViaOutlook(resource, selectedResources) {
  const filePaths = await getFilePathsForCommand(resource, selectedResources);
  
  if (filePaths.length === 0) {
    vscode.window.showInformationMessage('ファイルまたはフォルダを選択してください');
    return;
  }
  
  await createEncryptedZipAndSend(filePaths);
}

/**
 * パスワードパターン設定コマンド
 * @returns {Promise<void>}
 */
async function configurePatterns() {
  await vscode.commands.executeCommand(
    'workbench.action.openSettings',
    'encryptedZip.passwordPatterns'
  );
}

module.exports = {
  createFromExplorer,
  createFromActiveFile,
  createFromDragAndDrop,
  createAndSendViaOutlook,
  configurePatterns,
  createEncryptedZip,
  createEncryptedZipAndSend
};