// test/extension.test.js
const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { generateRandomPassword } = require('../extension');

// テストスイートの一群
suite('Encrypted ZIP Extension Test Suite', () => {
  // テスト前の設定
  suiteSetup(async () => {
    // 拡張機能がアクティブになるまで待機
    //await vscode.extensions.getExtension('purpleheadz.vscode-encrypted-zip').activate();
    
    // 一時テストファイルの作成
    const tempFilePath = path.join(os.tmpdir(), 'vscode-encrypted-zip-test.txt');
    fs.writeFileSync(tempFilePath, 'This is a test file for vscode-encrypted-zip extension.');
    
    // テスト用フォルダの作成
    const tempFolderPath = path.join(os.tmpdir(), 'vscode-encrypted-zip-test-folder');
    if (!fs.existsSync(tempFolderPath)) {
      fs.mkdirSync(tempFolderPath);
      fs.writeFileSync(path.join(tempFolderPath, 'test1.txt'), 'Test file 1');
      fs.writeFileSync(path.join(tempFolderPath, 'test2.txt'), 'Test file 2');
    }
  });

  // 各テスト後のクリーンアップ
  teardown(() => {
    // 必要なクリーンアップを行う
  });

  // テスト完了後のクリーンアップ
  suiteTeardown(() => {
    // テスト用ファイルを削除
    const tempFilePath = path.join(os.tmpdir(), 'vscode-encrypted-zip-test.txt');
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // テスト用フォルダを削除
    const tempFolderPath = path.join(os.tmpdir(), 'vscode-encrypted-zip-test-folder');
    if (fs.existsSync(tempFolderPath)) {
      fs.rmdirSync(tempFolderPath, { recursive: true });
    }
  });

  // パスワード生成関数のテスト
  test('パスワード生成のテスト', () => {
    const password = generateRandomPassword(16);
    
    // パスワードの長さが正しいことを確認
    assert.strictEqual(password.length, 16);
    
    // 大文字、小文字、数字、特殊文字が含まれていることを確認
    assert.ok(/[A-Z]/.test(password), 'パスワードに大文字が含まれていない');
    assert.ok(/[a-z]/.test(password), 'パスワードに小文字が含まれていない');
    assert.ok(/[0-9]/.test(password), 'パスワードに数字が含まれていない');
    assert.ok(/[!@#$%^&*()_\-+=<>?]/.test(password), 'パスワードに特殊文字が含まれていない');
  });

});