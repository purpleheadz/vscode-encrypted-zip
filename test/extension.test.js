// test/extension.test.js
const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sinon = require('sinon');
const { generateRandomPassword, createEncryptedZip } = require('../extension');
const { generateRandomPassword: passwordGenerate } = require('../src/password');
const { selectZipSaveLocation, generateDefaultZipFileName } = require('../src/zipCreator');

// テストスイートの一群
suite('Encrypted ZIP Extension Test Suite', () => {
  // テスト用のパス
  let tempFilePath;
  let tempFilePath2;
  let tempFolderPath;
  
  // テスト前の設定
  suiteSetup(async () => {
    // 一時テストファイルの作成
    tempFilePath = path.join(os.tmpdir(), 'vscode-encrypted-zip-test.txt');
    fs.writeFileSync(tempFilePath, 'This is a test file for vscode-encrypted-zip extension.');
    
    // 2つ目のテストファイル
    tempFilePath2 = path.join(os.tmpdir(), 'vscode-encrypted-zip-test2.txt');
    fs.writeFileSync(tempFilePath2, 'This is another test file for multi-file testing.');
    
    // テスト用フォルダの作成
    tempFolderPath = path.join(os.tmpdir(), 'vscode-encrypted-zip-test-folder');
    if (!fs.existsSync(tempFolderPath)) {
      fs.mkdirSync(tempFolderPath);
      fs.writeFileSync(path.join(tempFolderPath, 'test1.txt'), 'Test file 1');
      fs.writeFileSync(path.join(tempFolderPath, 'test2.txt'), 'Test file 2');
    }
  });

  // 各テスト後のクリーンアップ
  teardown(() => {
    // スタブのリストア
    sinon.restore();
  });

  // テスト完了後のクリーンアップ
  suiteTeardown(() => {
    // テスト用ファイルを削除
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    if (fs.existsSync(tempFilePath2)) {
      fs.unlinkSync(tempFilePath2);
    }
    
    // テスト用フォルダを削除
    if (fs.existsSync(tempFolderPath)) {
      fs.rmSync(tempFolderPath, { recursive: true, force: true });
    }
  });

  // パスワード生成関数のテスト - 数値パラメータ（レガシーモード）
  test('パスワード生成のテスト - 長さ指定', () => {
    // VS Codeの設定をモック
    const getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
    getConfigurationStub.returns({
      get: sinon.stub().returns([
        {
          name: "標準 (大文字/小文字/数字/記号)",
          uppercase: true, 
          lowercase: true,
          numbers: true,
          specialChars: true,
          length: 16
        }
      ])
    });
    
    const password = passwordGenerate(16);
    
    // パスワードの長さが正しいことを確認
    assert.strictEqual(password.length, 16);
    
    // 大文字、小文字、数字、特殊文字が含まれていることを確認
    assert.ok(/[A-Z]/.test(password), 'パスワードに大文字が含まれていない');
    assert.ok(/[a-z]/.test(password), 'パスワードに小文字が含まれていない');
    assert.ok(/[0-9]/.test(password), 'パスワードに数字が含まれていない');
    assert.ok(/[!@#$%^&*()_\-+=<>?]/.test(password), 'パスワードに特殊文字が含まれていない');
  });
  
  // パスワード生成関数のテスト - カスタムパターン
  test('パスワード生成のテスト - カスタムパターン', () => {
    // VS Codeの設定をモック
    const getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
    getConfigurationStub.returns({
      get: sinon.stub().returns([])
    });
    
    // 数字のみのパスワードパターン
    const pattern = {
      uppercase: false,
      lowercase: false,
      numbers: true,
      specialChars: false,
      length: 8
    };
    
    const password = passwordGenerate(pattern);
    
    // パスワードの長さが正しいことを確認
    assert.strictEqual(password.length, 8);
    
    // 数字のみが含まれていることを確認
    assert.ok(/^[0-9]+$/.test(password), 'パスワードに数字以外の文字が含まれている');
  });
  
  // ZIP保存場所の生成テスト - 複数ファイル
  test('複数ファイル選択時のデフォルトファイル名テスト', () => {
    const multiFilePaths = [tempFilePath, tempFilePath2];
    const { defaultFileName, defaultDir } = generateDefaultZipFileName(multiFilePaths);
    
    // デフォルトファイル名がarchive_で始まるか確認
    assert.ok(
      defaultFileName.startsWith('archive_'),
      'デフォルトファイル名が複数ファイル用の命名規則（archive_タイムスタンプ）になっていない'
    );
    
    // デフォルトディレクトリが正しいか確認
    assert.strictEqual(defaultDir, path.dirname(tempFilePath));
  });
  
  // ZIP保存場所の生成テスト - 単一ファイル
  test('単一ファイル選択時のデフォルトファイル名テスト', () => {
    const singleFilePath = [tempFilePath];
    const fileName = path.basename(tempFilePath);
    const { defaultFileName, defaultDir } = generateDefaultZipFileName(singleFilePath);
    
    // デフォルトファイル名が元のファイル名を含むか確認
    assert.strictEqual(defaultFileName, fileName);
    
    // デフォルトディレクトリが正しいか確認
    assert.strictEqual(defaultDir, path.dirname(tempFilePath));
  });
  
  // 拡張機能のアクティベーションテスト
  test('拡張機能のアクティベーションテスト', () => {
    // VSCodeの拡張機能コンテキストをモック
    const context = {
      subscriptions: []
    };
    
    // コマンド登録をモック
    const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand').returns({
      dispose: () => {}
    });
    
    // archiverの重複登録を防ぐためのモック
    const archiver = require('archiver');
    const originalRegisterFormat = archiver.registerFormat;
    const registerFormatStub = sinon.stub(archiver, 'registerFormat').callsFake((name, module) => {
      // 既に登録されている場合は何もしない
      if (archiver.isRegisteredFormat && archiver.isRegisteredFormat(name)) {
        return;
      }
      // 登録されていない場合のみ元の関数を呼び出す
      try {
        originalRegisterFormat.call(archiver, name, module);
      } catch (error) {
        // 既に登録されているエラーは無視
        if (!error.message.includes('format already registered')) {
          throw error;
        }
      }
    });
    
    // 拡張機能をアクティブ化
    const extensionModule = require('../extension');
    extensionModule.activate(context);
    
    // 必要なコマンドが登録されたことを確認
    sinon.assert.calledWith(registerCommandStub, 'vscode-encrypted-zip.createEncryptedZip');
    sinon.assert.calledWith(registerCommandStub, 'vscode-encrypted-zip.createFromActiveFile');
    sinon.assert.calledWith(registerCommandStub, 'vscode-encrypted-zip.createFromDragDrop');
    sinon.assert.calledWith(registerCommandStub, 'vscode-encrypted-zip.configurePasswordPatterns');
    sinon.assert.calledWith(registerCommandStub, 'vscode-encrypted-zip.createAndSendViaOutlook');
    
    // subscriptionsに追加されたことを確認
    assert.strictEqual(context.subscriptions.length, 5);
  });
  
  // エクスポートされた関数のテスト
  test('エクスポートされた関数の存在確認', () => {
    const extensionModule = require('../extension');
    
    // 必要な関数がエクスポートされていることを確認
    assert.ok(typeof extensionModule.activate === 'function', 'activate関数がエクスポートされていない');
    assert.ok(typeof extensionModule.deactivate === 'function', 'deactivate関数がエクスポートされていない');
    assert.ok(typeof extensionModule.generateRandomPassword === 'function', 'generateRandomPassword関数がエクスポートされていない');
    assert.ok(typeof extensionModule.createEncryptedZip === 'function', 'createEncryptedZip関数がエクスポートされていない');
    assert.ok(typeof extensionModule.createEncryptedZipAndSend === 'function', 'createEncryptedZipAndSend関数がエクスポートされていない');
    assert.ok(typeof extensionModule.sendViaOutlook === 'function', 'sendViaOutlook関数がエクスポートされていない');
  });
});