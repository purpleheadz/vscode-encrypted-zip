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
    const showSaveDialogStub = sinon.stub(vscode.window, 'showSaveDialog').resolves(undefined);
    const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves('キャンセル');
    const clipboardStub = sinon.stub(vscode.env.clipboard, 'writeText').resolves();
    
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
    }
  });
  
  // 単一ファイル選択時のデフォルトファイル名生成テスト
  test('単一ファイル選択時のデフォルトファイル名テスト', async () => {
    // VSCodeのAPIをスタブ化
    const showSaveDialogStub = sinon.stub(vscode.window, 'showSaveDialog').resolves(undefined);
    const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves('キャンセル');
    const clipboardStub = sinon.stub(vscode.env.clipboard, 'writeText').resolves();
    
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
    }
  });
  
  // コンテキストメニューからの複数ファイル選択テスト
  test('コンテキストメニューからの複数ファイル選択テスト', async () => {
    // VSCodeの拡張機能コンテキストをモック
    const context = {
      subscriptions: []
    };
    
    // 拡張機能のモジュールを再読み込み
    const extension = require('../extension');
    
    // コマンド登録をスパイ
    const registerCommandSpy = sinon.spy(vscode.commands, 'registerCommand');
    
    // 拡張機能をアクティブ化
    extension.activate(context);
    
    // createEncryptedZip コマンドが登録されたことを確認
    sinon.assert.calledWith(registerCommandSpy, 'vscode-encrypted-zip.createEncryptedZip');
    
    // 登録された関数を取得
    const commandHandler = registerCommandSpy.args.find(
      args => args[0] === 'vscode-encrypted-zip.createEncryptedZip'
    )[1];
    
    // コマンドハンドラーが関数であることを確認
    assert.strictEqual(typeof commandHandler, 'function');
    
    // VSCodeのAPIをスタブ化
    const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
    const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage').resolves();
    
    // URI配列を作成して複数選択をシミュレート
    const mockUris = [
      { fsPath: tempFilePath },
      { fsPath: tempFilePath2 }
    ];
    
    // テスト用のセットアップ - createEncryptedZip関数をスタブ化
    const createEncryptedZipStub = sinon.stub(extension, 'createEncryptedZip').resolves();
    
    // コマンドハンドラーを実行 (resource=最初のURI, selectedResources=すべてのURI)
    await commandHandler(mockUris[0], mockUris);
    
    // createEncryptedZipが正しいパラメータで呼ばれたか検証
    sinon.assert.calledOnce(createEncryptedZipStub);
    
    // 複数ファイルパスが渡されたか確認
    const filePaths = createEncryptedZipStub.firstCall.args[0];
    assert.strictEqual(filePaths.length, 2, '複数ファイルが渡されていない');
    assert.strictEqual(filePaths[0], tempFilePath);
    assert.strictEqual(filePaths[1], tempFilePath2);
  });
});