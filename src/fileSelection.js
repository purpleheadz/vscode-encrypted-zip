const vscode = require('vscode');

/**
 * リソースからファイルパスの配列を取得する
 * @param {object} resource メインリソース
 * @param {object[]} selectedResources 選択されたリソース配列
 * @returns {string[]} ファイルパスの配列
 */
function getFilePathsFromResources(resource, selectedResources) {
  console.log('Resource:', resource);
  console.log('Selected Resources:', selectedResources);
  
  if (Array.isArray(resource) && !selectedResources) {
    console.log('リソースが配列形式で渡されました - 互換性対応');
    selectedResources = resource;
    resource = selectedResources[0];
  }
  
  let filePaths = [];
  
  if (selectedResources && selectedResources.length > 0) {
    console.log('複数選択処理');
    filePaths = selectedResources.map(uri => {
      return uri.fsPath || uri.path || uri;
    });
  }
  else if (resource) {
    console.log('単一選択処理');
    const resourcePath = resource.fsPath || resource.path || resource;
    console.log('Resource path:', resourcePath);
    filePaths = [resourcePath];
  }
  
  return filePaths;
}

/**
 * ファイル選択ダイアログを表示してファイルパスを取得する
 * @param {object} options ダイアログオプション
 * @returns {Promise<string[]>} 選択されたファイルパスの配列
 */
async function showFileSelectionDialog(options = {}) {
  const defaultOptions = {
    canSelectMany: true,
    openLabel: '暗号化するファイル/フォルダを選択',
    canSelectFiles: true,
    canSelectFolders: true
  };
  
  const dialogOptions = { ...defaultOptions, ...options };
  
  const uris = await vscode.window.showOpenDialog(dialogOptions);
  
  if (uris && uris.length > 0) {
    return uris.map(uri => uri.fsPath || uri.path || uri);
  }
  
  return [];
}

/**
 * アクティブなエディタからファイルパスを取得する
 * @returns {string|null} アクティブなファイルのパスまたはnull
 */
function getActiveEditorFilePath() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }
  
  return editor.document.uri.fsPath;
}

/**
 * コマンド実行時のファイルパス取得処理
 * @param {object} resource メインリソース
 * @param {object[]} selectedResources 選択されたリソース配列
 * @returns {Promise<string[]>} ファイルパスの配列
 */
async function getFilePathsForCommand(resource, selectedResources) {
  let filePaths = getFilePathsFromResources(resource, selectedResources);
  
  if (filePaths.length === 0) {
    console.log('選択なし - ファイル選択ダイアログを表示');
    filePaths = await showFileSelectionDialog();
  }
  
  return filePaths;
}

module.exports = {
  getFilePathsFromResources,
  showFileSelectionDialog,
  getActiveEditorFilePath,
  getFilePathsForCommand
};