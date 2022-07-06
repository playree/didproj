- [DID Project](#did-project)
    - [パッケージの管理はyarn](#パッケージの管理はyarn)
- [フォルダ構成](#フォルダ構成)
- [VSCode](#vscode)
    - [拡張機能](#拡張機能)
    - [設定](#設定)

# DID Project

## パッケージの管理はyarn

パッケージの管理には`npm`ではなく、`yarn`を採用する。  
まずはインストールする。

```
npm install -g yarn
```

# フォルダ構成

* did-sdk  
  Wallet, Issuer, Verifier を作成するためのSDK
* did-wallet  
  Wallet サンプル
* did-server  
  Issuer, Verifier サンプル

# VSCode

## 拡張機能

* ESLint (dbaeumer.vscode-eslint)
* Prettier - Code formatter (esbenp.prettier-vscode)

## 設定

| 項目                    | 設定値                 | 説明                     |
| ----------------------- | ---------------------- | ------------------------ |
| editor.defaultFormatter | esbenp.prettier-vscode | prettierでフォーマット   |
| editor.formatOnSave     | true                   | 保存時に自動フォーマット |

