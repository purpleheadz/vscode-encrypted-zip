const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const archiverZipEncrypted = require('archiver-zip-encrypted');

archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

/**
 * デフォルトのZIPファイル名を生成する
 * @param {string[]} filePaths ファイルパスの配列
 * @returns {object} デフォルトファイル名と保存ディレクトリ
 */
function generateDefaultZipFileName(filePaths) {
  let defaultFileName;
  let defaultDir;
  
  if (filePaths.length === 1) {
    defaultFileName = path.basename(filePaths[0]);
    defaultDir = path.dirname(filePaths[0]);
  } else {
    defaultDir = path.dirname(filePaths[0]);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    defaultFileName = `archive_${timestamp}`;
  }
  
  return { defaultFileName, defaultDir };
}

/**
 * ZIP保存先を選択する
 * @param {string[]} filePaths ファイルパスの配列
 * @returns {Promise<vscode.Uri|null>} 選択された保存先URIまたはnull
 */
async function selectZipSaveLocation(filePaths) {
  const { defaultFileName, defaultDir } = generateDefaultZipFileName(filePaths);
  
  return await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(path.join(defaultDir, `${defaultFileName}.zip`)),
    filters: {
      'ZIP files': ['zip']
    }
  });
}

/**
 * アーカイブにファイルを追加する
 * @param {object} archive archiverインスタンス
 * @param {string[]} filePaths ファイルパスの配列
 */
function addFilesToArchive(archive, filePaths) {
  for (const filePath of filePaths) {
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      archive.directory(filePath, path.basename(filePath));
    } else {
      archive.file(filePath, { name: path.basename(filePath) });
    }
  }
}

/**
 * 暗号化ZIPファイルを作成する
 * @param {string[]} filePaths ファイルパスの配列
 * @param {string} password ZIPファイルのパスワード
 * @param {vscode.Uri} saveUri 保存先URI
 * @param {Function} onComplete 完了時のコールバック関数
 * @returns {Promise<void>}
 */
async function createEncryptedZipFile(filePaths, password, saveUri, onComplete = null) {
  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: '暗号化ZIPファイルを作成中...',
    cancellable: false
  };

  await vscode.window.withProgress(progressOptions, async (progress) => {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(saveUri.fsPath);
      
      const archive = archiver.create('zip-encrypted', {
        zlib: { level: 9 },
        encryptionMethod: 'zip20',
        password: password
      });
      
      output.on('close', async () => {
        if (onComplete) {
          await onComplete(saveUri.fsPath);
        }
        resolve();
      });
      
      archive.on('error', (err) => {
        vscode.window.showErrorMessage(`エラーが発生しました: ${err.message}`);
        reject(err);
      });
      
      let lastProgressUpdate = 0;
      archive.on('progress', (progressData) => {
        const now = Date.now();
        if (now - lastProgressUpdate > 200) {
          const percentage = progressData.entries.processed / progressData.entries.total * 100;
          progress.report({ 
            message: `${percentage.toFixed(1)}% 完了 (${progressData.entries.processed}/${progressData.entries.total})` 
          });
          lastProgressUpdate = now;
        }
      });
      
      archive.pipe(output);
      addFilesToArchive(archive, filePaths);
      archive.finalize();
    });
  });
}

module.exports = {
  generateDefaultZipFileName,
  selectZipSaveLocation,
  addFilesToArchive,
  createEncryptedZipFile
};