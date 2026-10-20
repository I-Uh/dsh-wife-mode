# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [1.0.0] - 2026-10-20

### 新增

- 主题配色：从海报取样的浅色/深色双套 14 个别名 token
- 右侧壁纸：海报裁切为 490×1080 竖条，内联进 client 模块
- 人妻模式开关：输入框右下角胶囊按钮，状态按会话独立保存
- 人格提示：由海报「关于我」「人妻模式特性」与台词提炼，含四条行为底线
- 插件元数据：`locale/en.json`、`locale/zh.json` 与原创鲸鱼图标

### 修复

- 客户端读写设置时改用 `ctx.get('remote.settings')`，修复 `remote.settings` 属性被 Cordis 服务访问检查拒绝、点击开关无反应的问题
- Host 侧人格改为单 section + 实时读取，移除对 `settings/document-updated` 到达顺序的依赖

### 变更

- 开关状态由全局 `wifeMode: boolean` 迁移为按会话的 `sessions: string[]`；升级时已开启的会话需要重新点亮
- 包名定为 `dsh-wife-mode`，与仓库同名
