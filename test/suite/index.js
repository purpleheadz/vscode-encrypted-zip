
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
                reject(new Error(`${failures} tests failed.`));
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
      