# tabichizu_docs

tabichizuの利用者向けドキュメントです。Docsifyで構成され、GitHub Pagesへ自動デプロイされます。

## ローカルで確認する

```bash
pnpm install
pnpm docs:serve
```

ブラウザで <http://localhost:3000> を開いてください。

## 検査する

```bash
pnpm docs:check
```

`main` ブランチへpushすると、GitHub Actionsが検査後にGitHub Pagesへ公開します。
