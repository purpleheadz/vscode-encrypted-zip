// test/runTest.js
const path = require('path');
const fs = require('fs');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    // 拡張機能の開発パス
    const extensionDevelopmentPath = path.resolve(__dirname, '../');
    
    // テストスクリプトのパス
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // テストスイートディレクトリの作成
    const testSuitePath = path.resolve(__dirname, './suite');
    if (!fs.existsSync(testSuitePath)) {
      fs.mkdirSync(testSuitePath, { recursive: true });
    }

    // テストインデックスファイルの作成
    const testIndexPath = path.join(testSuitePath, 'index.js');
    fs.writeFileSync(
      testIndexPath,
      `
      const path = require('path');
      const Mocha = require('mocha');
      const { glob } = require('glob');

      async function run() {
        // カスタムMochaオプション
        const mocha = new Mocha({
          ui: 'tdd',
          color: true,
          timeout: 20000  // より長いタイムアウト（20秒）
        });

        const testsRoot = path.resolve(__dirname, '..');
        
        try {
          // テストファイルを検索（*.test.jsのパターン）
          const files = await glob('**/*.test.js', { cwd: testsRoot });
          
          console.log('以下のテストファイルが実行されます:');
          files.forEach(file => console.log('- ' + file));
          
          // 全てのテストファイルをMochaに追加
          files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
          
          // テスト実行
          return new Promise((resolve, reject) => {
            mocha.run(failures => {
              if (failures > 0) {
                reject(new Error(\`\${failures} tests failed.\`));
              } else {
                resolve();
              }
            });
          });
        } catch (err) {
          console.error('テストファイルの検索中にエラーが発生しました:', err);
          throw err;
        }
      }

      module.exports = { run };
      `
    );

    // 環境変数の設定（テスト中に役立つ情報）
    process.env.VSCODE_EXTENSION_TEST = 'true';
    process.env.TEST_WORKSPACE = extensionDevelopmentPath;

    console.log('テスト開始: VSCode拡張機能のテストを実行します');
    console.log('拡張機能パス:', extensionDevelopmentPath);

    // VSCodeでテストを実行
    await runTests({
      version: 'stable',
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--enable-proposed-api=' + path.basename(extensionDevelopmentPath)
      ]
    });

    console.log('テスト完了: すべてのテストが成功しました');
  } catch (err) {
    console.error('テスト実行中にエラーが発生しました:', err);
    process.exit(1);
  }
}

main();