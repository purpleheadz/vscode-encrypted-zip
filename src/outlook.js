const vscode = require('vscode');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');

/**
 * OutlookでZIPファイルを送付する
 * @param {string} zipFilePath ZIPファイルのパス
 * @returns {Promise<void>}
 */
async function sendViaOutlook(zipFilePath) {
  const platform = os.platform();
  const fileName = path.basename(zipFilePath);
  
  try {
    if (platform === 'win32') {
      const command = `start outlook /m "&subject=暗号化ZIPファイル ${fileName}&attach=${zipFilePath}"`;
      
      exec(command, (error) => {
        if (error) {
          console.error('Outlook起動エラー:', error);
          vscode.window.showErrorMessage(`Outlookの起動に失敗しました: ${error.message}`);
          return;
        }
        vscode.window.showInformationMessage(`Outlookでメール作成画面を開きました (ファイル: ${fileName})`);
      });
    } else if (platform === 'darwin') {
      const command = `open -a "Microsoft Outlook" "${zipFilePath}"`;
      
      exec(command, (error) => {
        if (error) {
          console.error('Outlook起動エラー:', error);
          vscode.window.showErrorMessage(`Outlookの起動に失敗しました: ${error.message}`);
          return;
        }
        vscode.window.showInformationMessage(`Outlookでメール作成画面を開きました (ファイル: ${fileName})`);
      });
    } else {
      const command = `xdg-open "mailto:?subject=暗号化ZIPファイル ${fileName}&attach=${zipFilePath}"`;
      
      exec(command, (error) => {
        if (error) {
          console.error('メールクライアント起動エラー:', error);
          vscode.window.showErrorMessage(`メールクライアントの起動に失敗しました: ${error.message}`);
          return;
        }
        vscode.window.showInformationMessage(`メールクライアントでメール作成画面を開きました (ファイル: ${fileName})`);
      });
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Outlook送付エラー: ${error.message}`);
  }
}

/**
 * ZIP作成完了後にOutlookオプションを表示する
 * @param {string} zipFilePath ZIPファイルのパス
 * @returns {Promise<void>}
 */
async function showOutlookOption(zipFilePath) {
  const options = ['Outlookで送信', '完了'];
  
  const selection = await vscode.window.showInformationMessage(
    `暗号化ZIPファイルを作成しました: ${path.basename(zipFilePath)}\nパスワードはクリップボードにコピーされています`,
    ...options
  );
  
  if (selection === 'Outlookで送信') {
    await sendViaOutlook(zipFilePath);
  }
}

/**
 * ZIP作成完了後に自動的にOutlookで送信する
 * @param {string} zipFilePath ZIPファイルのパス
 * @returns {Promise<void>}
 */
async function autoSendViaOutlook(zipFilePath) {
  vscode.window.showInformationMessage(
    `暗号化ZIPファイルを作成しました: ${path.basename(zipFilePath)}\nパスワードはクリップボードにコピーされています\nOutlookを起動しています...`
  );
  
  await sendViaOutlook(zipFilePath);
}

module.exports = {
  sendViaOutlook,
  showOutlookOption,
  autoSendViaOutlook
};