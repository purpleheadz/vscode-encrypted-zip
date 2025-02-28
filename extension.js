// extension.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const archiverZipEncrypted = require('archiver-zip-encrypted');
const crypto = require('crypto');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Encrypted ZIP Creator is now active');

  // ZIPフォーマットを登録
  archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

  // エクスプローラービューからのファイル/フォルダ選択用コマンド
  let createFromExplorer = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createEncryptedZip',
    async (resource, selectedResources) => {
      let filePaths = [];
      
      // 複数選択されている場合 (selectedResources がある場合)
      if (selectedResources && selectedResources.length > 0) {
        filePaths = selectedResources.map(uri => uri.fsPath);
      }
      // 単一のリソースが選択された場合 (resource のみある場合)
      else if (resource) {
        filePaths = [resource.fsPath];
      } 
      // 選択されたファイルがない場合、ファイル選択ダイアログを表示
      else {
        const uris = await vscode.window.showOpenDialog({
          canSelectMany: true,
          openLabel: '暗号化するファイル/フォルダを選択',
          canSelectFiles: true,
          canSelectFolders: true
        });
        
        if (uris && uris.length > 0) {
          filePaths = uris.map(uri => uri.fsPath);
        }
      }

      if (filePaths.length === 0) {
        vscode.window.showInformationMessage('ファイルまたはフォルダを選択してください');
        return;
      }

      await createEncryptedZip(filePaths);
    }
  );

  // エディタからの選択用コマンド
  let createFromEditor = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createFromActiveFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('アクティブなエディタがありません');
        return;
      }
      
      const filePath = editor.document.uri.fsPath;
      await createEncryptedZip([filePath]);
    }
  );

  // ドラッグ＆ドロップのエミュレーション用コマンド
  let createFromDragAndDrop = vscode.commands.registerCommand(
    'vscode-encrypted-zip.createFromDragDrop',
    async () => {
      // ユーザーにファイル/フォルダの選択を促す
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: '暗号化するファイル/フォルダを選択',
        canSelectFiles: true,
        canSelectFolders: true
      });
      
      if (uris && uris.length > 0) {
        const filePaths = uris.map(uri => uri.fsPath);
        await createEncryptedZip(filePaths);
      }
    }
  );

  context.subscriptions.push(createFromExplorer);
  context.subscriptions.push(createFromEditor);
  context.subscriptions.push(createFromDragAndDrop);
}

/**
 * 強力なランダムパスワードを生成する
 * @param {number} length パスワードの長さ
 * @returns {string} 生成されたパスワード
 */
function generateRandomPassword(length = 16) {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_-+=<>?';
  
  const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;
  let password = '';
  
  // 各カテゴリから少なくとも1文字を確保
  password += uppercaseChars.charAt(Math.floor(crypto.randomInt(uppercaseChars.length)));
  password += lowercaseChars.charAt(Math.floor(crypto.randomInt(lowercaseChars.length)));
  password += numbers.charAt(Math.floor(crypto.randomInt(numbers.length)));
  password += specialChars.charAt(Math.floor(crypto.randomInt(specialChars.length)));
  
  // 残りの文字をランダムに生成
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(crypto.randomInt(allChars.length)));
  }
  
  // 文字列をシャッフル
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * クリップボードにテキストをコピーする
 * @param {string} text コピーするテキスト
 */
async function copyToClipboard(text) {
  await vscode.env.clipboard.writeText(text);
}

/**
 * 暗号化ZIPファイルを作成する
 * @param {string[]} filePaths 圧縮するファイルパスの配列
 */
async function createEncryptedZip(filePaths) {
  // ランダムパスワードを生成
  const password = generateRandomPassword(16);
  
  // クリップボードにパスワードをコピー
  await copyToClipboard(password);
  
  // ユーザーに自動生成されたパスワードを確認または変更する選択肢を提供
  const options = ['このパスワードを使用', '自分でパスワードを入力', 'キャンセル'];
  
  const selection = await vscode.window.showInformationMessage(
    `自動生成されたパスワード「${password}」がクリップボードにコピーされました。`, 
    ...options
  );
  
  let finalPassword = password;
  
  if (selection === '自分でパスワードを入力') {
    // ユーザーがカスタムパスワードを入力する場合
    const customPassword = await vscode.window.showInputBox({
      prompt: 'ZIPファイルのパスワードを入力してください',
      password: true,
      validateInput: (value) => {
        return value.length < 6 ? 'パスワードは最低6文字必要です' : null;
      }
    });
    
    if (!customPassword) {
      vscode.window.showInformationMessage('パスワードが入力されなかったため、処理を中止しました');
      return;
    }
    
    finalPassword = customPassword;
  } else if (selection !== 'このパスワードを使用') {
    // キャンセルまたは他の選択肢が選ばれた場合
    vscode.window.showInformationMessage('暗号化ZIPの作成をキャンセルしました');
    return;
  }

  // 保存先の選択
  let defaultFileName;
  let defaultDir;
  
  if (filePaths.length === 1) {
    // 単一ファイル/フォルダの場合はその名前を使用
    defaultFileName = path.basename(filePaths[0]);
    defaultDir = path.dirname(filePaths[0]);
  } else {
    // 複数ファイル/フォルダの場合は共通の親ディレクトリ名 + 日時を使用
    defaultDir = path.dirname(filePaths[0]);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    defaultFileName = `archive_${timestamp}`;
  }
  
  const saveUri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(path.join(defaultDir, `${defaultFileName}.zip`)),
    filters: {
      'ZIP files': ['zip']
    }
  });

  if (!saveUri) {
    vscode.window.showInformationMessage('保存先が選択されなかったため、処理を中止しました');
    return;
  }

  try {
    // 進捗表示
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: '暗号化ZIPファイルを作成中...',
      cancellable: false
    };

    await vscode.window.withProgress(progressOptions, async (progress) => {
      return new Promise((resolve, reject) => {
        // 出力ストリームの作成
        const output = fs.createWriteStream(saveUri.fsPath);
        
        // 暗号化ZIPアーカイバの作成
        const archive = archiver.create('zip-encrypted', {
          zlib: { level: 9 },
          encryptionMethod: 'zip20',
          password: finalPassword
        });
        
        // 処理完了時の処理
        output.on('close', () => {
          vscode.window.showInformationMessage(
            `暗号化ZIPファイルを作成しました: ${path.basename(saveUri.fsPath)}\nパスワードはクリップボードにコピーされています`
          );
          resolve();
        });
        
        // エラー処理
        archive.on('error', (err) => {
          vscode.window.showErrorMessage(`エラーが発生しました: ${err.message}`);
          reject(err);
        });
        
        // 進捗報告
        let lastProgressUpdate = 0;
        archive.on('progress', (progressData) => {
          const now = Date.now();
          // 進捗表示の更新頻度を制限（200ms間隔）
          if (now - lastProgressUpdate > 200) {
            const percentage = progressData.entries.processed / progressData.entries.total * 100;
            progress.report({ 
              message: `${percentage.toFixed(1)}% 完了 (${progressData.entries.processed}/${progressData.entries.total})` 
            });
            lastProgressUpdate = now;
          }
        });
        
        // アーカイブをパイプ
        archive.pipe(output);
        
        // ファイルを追加
        for (const filePath of filePaths) {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // フォルダの場合は再帰的に追加
            archive.directory(filePath, path.basename(filePath));
          } else {
            // ファイルの場合はそのまま追加
            archive.file(filePath, { name: path.basename(filePath) });
          }
        }
        
        // アーカイブを完了
        archive.finalize();
      });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`エラーが発生しました: ${error.message}`);
  }
}

function deactivate() {}

// テスト用に関数をエクスポート
module.exports = {
  activate,
  deactivate,
  generateRandomPassword,
  createEncryptedZip
};