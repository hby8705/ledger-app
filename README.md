# 记账本

个人记账 App — 多币种 · 信用卡管理 · 月度统计 · PWA 离线可用

## 功能
- 多币种记账（预设人民币/新台币，可自定义）
- 现金 + 信用卡双支付方式
- 信用卡额度管理 + 本期/下期归属 + 还款结转
- 月度按币种/类别/卡别统计
- 历史账单搜索筛选编辑
- PWA 支持，可安装到手机离线使用

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
