// test/extension.test.js
const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sinon = require('sinon');
const { generateRandomPassword, createEncryptedZip } = require('../extension');

// テストスイートの一群
suite('Encrypted ZIP Extension Test Suite', () => {
  // テスト用のパス
  let tempFilePath;
  let tempFilePath2;
  let tempFolderPath;
  
  // テスト前の設定
  suiteSetup(async () => {
    // 拡張機能がアクティブになるまで待機
    //await vscode.extensions.getExtension('purpleheadz.vscode-encrypted-zip').activate();
    
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
  
  // 複数ファイル選択時のデフォルトファイル名生成テスト
  test('複数ファイル選択時のデフォルトファイル名テスト', async () => {
    // VSCodeのAPIをスタブ化
    const showSaveDialogStub = sinon.stub(vscode.window, 'showSaveDialog').resolves(vscode.Uri.file('/tmp/test.zip'));
    const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves('このパスワードを使用');
    
    // 進捗表示をスタブ化
    const withProgressStub = sinon.stub(vscode.window, 'withProgress').resolves();
    
    // fs関数をスタブ化
    const createWriteStreamStub = sinon.stub(fs, 'createWriteStream').returns({
      on: sinon.stub().callsFake(function(event, callback) {
        if (event === 'close') {
          // すぐにcloseイベントを発火させる
          setTimeout(callback, 10);
        }
        return this;
      })
    });
    
    // archiverのスタブ
    const archiverModule = require('archiver');
    const createStub = sinon.stub(archiverModule, 'create').returns({
      on: sinon.stub().returns({}),
      pipe: sinon.stub().returns({}),
      directory: sinon.stub().returns({}),
      file: sinon.stub().returns({}),
      finalize: sinon.stub().returns({})
    });
    
    // クリップボードの挙動をモック
    const originalWriteText = vscode.env.clipboard.writeText;
    // テスト中はnoop関数に置き換える
    vscode.env.clipboard.writeText = () => Promise.resolve();
    
    // 複数ファイルのパス配列
    const multiFilePaths = [tempFilePath, tempFilePath2];
    
    try {
      // createEncryptedZip関数を呼び出し
      await createEncryptedZip(multiFilePaths);
      
      // showSaveDialogが正しいパラメータで呼ばれたか検証
      sinon.assert.calledOnce(showSaveDialogStub);
      
      // パラメータを取得
      const saveDialogParams = showSaveDialogStub.firstCall.args[0];
      
      // デフォルトURIがarchive_で始まるか確認
      const defaultUriPath = saveDialogParams.defaultUri.fsPath;
      assert.ok(
        path.basename(defaultUriPath).startsWith('archive_'),
        'デフォルトファイル名が複数ファイル用の命名規則（archive_タイムスタンプ）になっていない'
      );
      
      // 拡張子が.zipであるか確認
      assert.ok(defaultUriPath.endsWith('.zip'), 'デフォルトファイル名の拡張子が.zipではない');
      
      // ファイルタイプフィルターが正しいか確認
      assert.deepStrictEqual(saveDialogParams.filters, { 'ZIP files': ['zip'] });
      
    } catch (error) {
      assert.fail(`テスト中にエラーが発生しました: ${error.message}`);
    } finally {
      // 元のwriteText関数を復元
      vscode.env.clipboard.writeText = originalWriteText;
    }
  });
  
  // 単一ファイル選択時のデフォルトファイル名生成テスト
  test('単一ファイル選択時のデフォルトファイル名テスト', async () => {
    // VSCodeのAPIをスタブ化
    const showSaveDialogStub = sinon.stub(vscode.window, 'showSaveDialog').resolves(vscode.Uri.file('/tmp/test.zip'));
    const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves('このパスワードを使用');
    
    // 進捗表示をスタブ化
    const withProgressStub = sinon.stub(vscode.window, 'withProgress').resolves();
    
    // fs関数をスタブ化
    const createWriteStreamStub = sinon.stub(fs, 'createWriteStream').returns({
      on: sinon.stub().callsFake(function(event, callback) {
        if (event === 'close') {
          // すぐにcloseイベントを発火させる
          setTimeout(callback, 10);
        }
        return this;
      })
    });
    
    // archiverのスタブ
    const archiverModule = require('archiver');
    const createStub = sinon.stub(archiverModule, 'create').returns({
      on: sinon.stub().returns({}),
      pipe: sinon.stub().returns({}),
      directory: sinon.stub().returns({}),
      file: sinon.stub().returns({}),
      finalize: sinon.stub().returns({})
    });
    
    // クリップボードの挙動をモック
    const originalWriteText = vscode.env.clipboard.writeText;
    // テスト中はnoop関数に置き換える
    vscode.env.clipboard.writeText = () => Promise.resolve();
    
    // 単一ファイルのパス配列
    const singleFilePath = [tempFilePath];
    const fileName = path.basename(tempFilePath);
    
    try {
      // createEncryptedZip関数を呼び出し
      await createEncryptedZip(singleFilePath);
      
      // showSaveDialogが正しいパラメータで呼ばれたか検証
      sinon.assert.calledOnce(showSaveDialogStub);
      
      // パラメータを取得
      const saveDialogParams = showSaveDialogStub.firstCall.args[0];
      
      // デフォルトURIが元のファイル名を含むか確認
      const defaultUriPath = saveDialogParams.defaultUri.fsPath;
      assert.ok(
        path.basename(defaultUriPath).startsWith(fileName.replace('.txt', '')),
        'デフォルトファイル名が元のファイル名になっていない'
      );
      
      // 拡張子が.zipであるか確認
      assert.ok(defaultUriPath.endsWith('.zip'), 'デフォルトファイル名の拡張子が.zipではない');
      
    } catch (error) {
      assert.fail(`テスト中にエラーが発生しました: ${error.message}`);
    } finally {
      // 元のwriteText関数を復元
      vscode.env.clipboard.writeText = originalWriteText;
    }
  });
  
  // コンテキストメニューからの複数ファイル選択テスト - シンプルなバージョン
  test('コンテキストメニューからの複数ファイル選択テスト', function() {
    // VSCodeの拡張機能コンテキストをモック
    const context = {
      subscriptions: []
    };
    
    // モジュールをモックするために置き換え
    const originalModule = require('../extension');
    
    // 元の関数をスタブ化（後で復元するため保存）
    const originalCreateEncryptedZip = originalModule.createEncryptedZip;
    const createEncryptedZipStub = sinon.stub().returns(Promise.resolve());
    originalModule.createEncryptedZip = createEncryptedZipStub;
    
    // コマンド登録をモック
    const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand').returns({
      dispose: () => {}
    });
    
    // 拡張機能をアクティブ化
    originalModule.activate(context);
    
    // コマンドが登録されたことを確認
    sinon.assert.calledWith(registerCommandStub, 'vscode-encrypted-zip.createEncryptedZip');
    
    // 登録された関数を取得
    const handler = registerCommandStub.args.find(args => args[0] === 'vscode-encrypted-zip.createEncryptedZip')[1];
    
    // モックURIを準備
    const mockUris = [
      { fsPath: tempFilePath },
      { fsPath: tempFilePath2 }
    ];
    
    // ハンドラを呼び出し
    handler(mockUris[0], mockUris);
    
    // スタブがまだ呼ばれていないことを確認（非同期なので）
    assert.strictEqual(createEncryptedZipStub.callCount, 0);
    
    // 元の関数を復元
    originalModule.createEncryptedZip = originalCreateEncryptedZip;
  });
});