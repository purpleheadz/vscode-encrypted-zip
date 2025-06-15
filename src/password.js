const vscode = require('vscode');
const crypto = require('crypto');

/**
 * 設定されたパターンに基づいてランダムパスワードを生成する
 * @param {number|object} patternOrLength パスワードパターン設定オブジェクトまたは長さ
 * @returns {string} 生成されたパスワード
 */
function generateRandomPassword(patternOrLength = 16) {
  const config = vscode.workspace.getConfiguration('encryptedZip');
  const passwordPatterns = config.get('passwordPatterns', []);
  
  let pattern;
  
  if (typeof patternOrLength === 'number') {
    pattern = {
      uppercase: true,
      lowercase: true, 
      numbers: true,
      specialChars: true,
      length: patternOrLength
    };
  } 
  else if (typeof patternOrLength === 'object') {
    pattern = patternOrLength;
  }
  else if (typeof patternOrLength === 'string') {
    const patternIndex = parseInt(patternOrLength, 10);
    if (!isNaN(patternIndex) && patternIndex >= 0 && patternIndex < passwordPatterns.length) {
      pattern = passwordPatterns[patternIndex];
    } else {
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
  
  if (availableChars === '') {
    availableChars = numbers;
    requiredChars = [numbers.charAt(Math.floor(crypto.randomInt(numbers.length)))];
  }
  
  const actualLength = Math.max(pattern.length, requiredChars.length);
  
  let password = requiredChars.join('');
  
  for (let i = requiredChars.length; i < actualLength; i++) {
    password += availableChars.charAt(Math.floor(crypto.randomInt(availableChars.length)));
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * パスワードパターンの説明を生成する
 * @param {object} pattern パスワードパターン
 * @returns {string} パターンの説明
 */
function getPatternDescription(pattern) {
  const parts = [];
  if (pattern.uppercase) parts.push("大文字");
  if (pattern.lowercase) parts.push("小文字");
  if (pattern.numbers) parts.push("数字");
  if (pattern.specialChars) parts.push("記号");
  return parts.join(", ") + "を含む";
}

/**
 * パスワードパターンの選択肢を表示し、選択されたパターンを返す
 * @param {string} placeHolder プレースホルダーテキスト
 * @returns {Promise<object|null>} 選択されたパターンまたはnull
 */
async function selectPasswordPattern(placeHolder = 'パスワードのパターンを選択してください') {
  const config = vscode.workspace.getConfiguration('encryptedZip');
  const passwordPatterns = config.get('passwordPatterns', []);
  
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
  
  const patternQuickPickItems = passwordPatterns.map((pattern, index) => ({
    label: pattern.name,
    description: `${pattern.length}文字`,
    detail: getPatternDescription(pattern),
    index: index
  }));
  
  patternQuickPickItems.push({
    label: "自分でパスワードを入力",
    description: "",
    detail: "カスタムパスワードを手動で入力します",
    index: -1
  });
  
  return await vscode.window.showQuickPick(patternQuickPickItems, {
    placeHolder: placeHolder,
    ignoreFocusOut: true
  });
}

/**
 * ユーザーからカスタムパスワードを入力させる
 * @returns {Promise<string|null>} 入力されたパスワードまたはnull
 */
async function inputCustomPassword() {
  return await vscode.window.showInputBox({
    prompt: 'ZIPファイルのパスワードを入力してください',
    password: true,
    validateInput: (value) => {
      return value.length < 6 ? 'パスワードは最低6文字必要です' : null;
    }
  });
}

module.exports = {
  generateRandomPassword,
  getPatternDescription,
  selectPasswordPattern,
  inputCustomPassword
};