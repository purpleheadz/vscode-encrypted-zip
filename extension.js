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
      // デバッグ情報
      console.log('コマンド実行: vscode-encrypted-zip.createEncryptedZip');
      console.log('Resource:', resource);
      console.log('Selected Resources:', selectedResources);
      
      // リソースがURI配列でない場合の対処
      if (Array.isArray(resource) && !selectedResources) {
        console.log('リソースが配列形式で渡されました - 互換性対応');
        selectedResources = resource;
        resource = selectedResources[0];
      }
      
      let filePaths = [];
      
      // 複数選択されている場合 (selectedResources がある場合)
      if (selectedResources && selectedResources.length > 0) {
        console.log('複数選択処理');
        filePaths = selectedResources.map(uri => uri.fsPath);
      }
      // 単一のリソースが選択された場合 (resource のみある場合)
      else if (resource) {
        console.log('単一選択処理');
        filePaths = [resource.fsPath];
      } 
      // 選択されたファイルがない場合、ファイル選択ダイアログを表示
      else {
        console.log('選択なし - ファイル選択ダイアログを表示');
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

  // パスワードパターン設定コマンド
  let configurePatterns = vscode.commands.registerCommand(
    'vscode-encrypted-zip.configurePasswordPatterns',
    async () => {
      // 設定ファイルを開く
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'encryptedZip.passwordPatterns'
      );
    }
  );

  context.subscriptions.push(createFromExplorer);
  context.subscriptions.push(createFromEditor);
  context.subscriptions.push(createFromDragAndDrop);
  context.subscriptions.push(configurePatterns);
}

/**
 * 設定されたパターンに基づいてランダムパスワードを生成する
 * @param {number|object} patternOrLength パスワードパターン設定オブジェクトまたは長さ
 * @returns {string} 生成されたパスワード
 */
function generateRandomPassword(patternOrLength = 16) {
  // 設定からパターンリストを取得
  const config = vscode.workspace.getConfiguration('encryptedZip');
  const passwordPatterns = config.get('passwordPatterns', []);
  
  let pattern;
  
  // 引数が数値の場合は、レガシーモードとして長さのみを指定したパターンを作成
  if (typeof patternOrLength === 'number') {
    pattern = {
      uppercase: true,
      lowercase: true, 
      numbers: true,
      specialChars: true,
      length: patternOrLength
    };
  } 
  // オブジェクトの場合はそのまま使用
  else if (typeof patternOrLength === 'object') {
    pattern = patternOrLength;
  }
  // パターンインデックスの場合は、対応するパターンを使用
  else if (typeof patternOrLength === 'string') {
    const patternIndex = parseInt(patternOrLength, 10);
    if (!isNaN(patternIndex) && patternIndex >= 0 && patternIndex < passwordPatterns.length) {
      pattern = passwordPatterns[patternIndex];
    } else {
      // デフォルトのパターンインデックスを使用
      const defaultIndex = config.get('defaultPasswordPattern', 0);
      pattern = passwordPatterns[defaultIndex] || passwordPatterns[0] || {
        uppercase: true,
        lowercase: true,
        numbers: true,
        specialChars: true,
        length: 16
      };
    }
  }
  
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_-+=<>?';
  
  // 使用する文字セットを決定
  let availableChars = '';
  let requiredChars = [];
  
  if (pattern.uppercase) {
    availableChars += uppercaseChars;
    requiredChars.push(uppercaseChars.charAt(Math.floor(crypto.randomInt(uppercaseChars.length))));
  }
  
  if (pattern.lowercase) {
    availableChars += lowercaseChars;
    requiredChars.push(lowercaseChars.charAt(Math.floor(crypto.randomInt(lowercaseChars.length))));
  }
  
  if (pattern.numbers) {
    availableChars += numbers;
    requiredChars.push(numbers.charAt(Math.floor(crypto.randomInt(numbers.length))));
  }
  
  if (pattern.specialChars) {
    availableChars += specialChars;
    requiredChars.push(specialChars.charAt(Math.floor(crypto.randomInt(specialChars.length))));
  }
  
  // 利用可能な文字がない場合は、安全のために数字のみのパスワードを生成
  if (availableChars === '') {
    availableChars = numbers;
    requiredChars = [numbers.charAt(Math.floor(crypto.randomInt(numbers.length)))];
  }
  
  // パスワードの長さが必須文字数より少ない場合は、少なくとも必須文字数にする
  const actualLength = Math.max(pattern.length, requiredChars.length);
  
  // 必須文字を必ず含める
  let password = requiredChars.join('');
  
  // 残りの文字をランダムに生成
  for (let i = requiredChars.length; i < actualLength; i++) {
    password += availableChars.charAt(Math.floor(crypto.randomInt(availableChars.length)));
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
  // 設定からパターンリストを取得
  const config = vscode.workspace.getConfiguration('encryptedZip');
  const passwordPatterns = config.get('passwordPatterns', []);
  
  // デフォルトのパターンがない場合は、標準のパターンを設定
  if (passwordPatterns.length === 0) {
    passwordPatterns.push({
      name: "標準 (大文字/小文字/数字/記号)",
      uppercase: true,
      lowercase: true,
      numbers: true,
      specialChars: true,
      length: 16
    });
  }
  
  // パスワードパターンの選択肢を表示
  const patternQuickPickItems = passwordPatterns.map((pattern, index) => ({
    label: pattern.name,
    description: `${pattern.length}文字`,
    detail: getPatternDescription(pattern),
    index: index
  }));
  
  // ヘルパー関数: パターンの説明を生成
  function getPatternDescription(pattern) {
    const parts = [];
    if (pattern.uppercase) parts.push("大文字");
    if (pattern.lowercase) parts.push("小文字");
    if (pattern.numbers) parts.push("数字");
    if (pattern.specialChars) parts.push("記号");
    return parts.join(", ") + "を含む";
  }
  
  // カスタムパスワード入力オプションを追加
  patternQuickPickItems.push({
    label: "自分でパスワードを入力",
    description: "",
    detail: "カスタムパスワードを手動で入力します",
    index: -1
  });
  
  const selectedPattern = await vscode.window.showQuickPick(patternQuickPickItems, {
    placeHolder: 'パスワードのパターンを選択してください',
    ignoreFocusOut: true
  });
  
  if (!selectedPattern) {
    vscode.window.showInformationMessage('暗号化ZIPの作成をキャンセルしました');
    return;
  }
  
  let finalPassword;
  
  // カスタムパスワード入力を選んだ場合
  if (selectedPattern.index === -1) {
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
  } else {
    // 選択されたパターンでパスワード生成
    const pattern = passwordPatterns[selectedPattern.index];
    const password = generateRandomPassword(pattern);
    
    // クリップボードにパスワードをコピー
    await copyToClipboard(password);
    
    // ユーザーに確認のメッセージを表示
    const options = ['このパスワードを使用', 'キャンセル'];
    
    const selection = await vscode.window.showInformationMessage(
      `生成されたパスワード「${password}」がクリップボードにコピーされました。`,
      ...options
    );
    
    if (selection !== 'このパスワードを使用') {
      // キャンセルまたは他の選択肢が選ばれた場合
      vscode.window.showInformationMessage('暗号化ZIPの作成をキャンセルしました');
      return;
    }
    
    finalPassword = password;
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