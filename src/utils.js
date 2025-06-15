const vscode = require('vscode');

/**
 * クリップボードにテキストをコピーする
 * @param {string} text コピーするテキスト
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  await vscode.env.clipboard.writeText(text);
}

module.exports = {
  copyToClipboard
};