# dsh-wife-mode · 雾蓝鲸主题

一个 DSH（DeepSeek Harness）Web 客户端的主题插件：把「人妻模式」海报里的雾蓝配色、右侧立绘，以及一个**每个对话独立**的人妻模式开关，一起装进界面。

> 插件由三部分组成：`ctx.theme` 的配色覆盖层、`shell.overlay` 的右侧壁纸、以及「人妻模式」开关——它把一个由海报信息提炼的人格段落，按会话加进系统提示。

## 预览

![右缘壁纸裁切](assets/wallpaper.jpg)

| 浅色 | 深色 |
| --- | --- |
| 雾蓝纸底 `#eef4fd`，墨蓝文字 `#182a52`，宝蓝点缀 `#3368cc` | 深夜蓝底 `#0c1422`，浅墨字 `#e9efff`，浅宝蓝 `#7fa9f0` |

## 功能

- **主题配色**：只覆盖 `--dsw-alias-*` / `--dsw-specific-sidebar-fill` 共 14 个别名 token，浅色与深色成对给出，不碰任何组件几何与行为——**只在人妻模式开启的会话里生效**
- **右侧壁纸**：海报裁成的竖条，固定在视口右侧、鼠标穿透、左缘渐变淡出；浮层顺序 `-100`，在所有 toast / 弹窗之下——同样只在人妻模式开启的会话里出现
- **人妻模式开关**：输入框工具行最右侧的小胶囊 `♡ 人妻模式`；状态按**会话 id** 存，A 会话开、B 会话关互不影响，子代理默认不吃人格
- **人格提示**：开启后，该会话的系统提示里多出一段角色设定（称呼、性格、爱好、口头禅参考）以及四条底线（技术准确优先、先答案后语气、严肃话题回退、不假装是人类）

## 安装

在 DSH 里让 agent 通过插件管理器安装这个包目录，或等价地调用：

```text
plugin_manager install_bundle(target: "<本仓库的绝对路径>")
```

安装后插件行名为 `dsh-wife-mode`，主题立即生效；设置写在 profile 的 `cordis.patch.yml` 里，重启后仍在。

卸载：`plugin_manager remove_bundle(target: "dsh-wife-mode")`。

## 使用

**人妻模式**：在任意会话的输入框右下方点 `♡ 人妻模式`。

- 点亮 = 本会话开启：界面换成海报配色、右侧出现立绘，从下一次模型请求起带人格
- 再点一次 = 本会话关闭：配色与立绘立即撤掉，回复也回到普通语气
- 面板位置：`conversation.input.right`；状态存在设置文档的 `sessions` 数组里

外观跟着**最近打开的那个会话**的开关走：切到没开启的会话，界面就是 dsh 原样；离开会话（设置、插件页等非会话界面）时保持最后一次的外观，刷新后也会按上次的会话恢复。

配色想微调，改 `src/client.template.js` 顶部的 `TOKENS` 后重新构建即可。

## 工作原理

| 能力 | 挂载点 | 说明 |
| --- | --- | --- |
| 配色 | `ctx.theme.overrideTokens` | 仅在当前会话开启时叠加该层，关闭或切走即还原，不修改主题注册表 |
| 壁纸 | `shell.overlay` 槽位 | 仅在当前会话开启时渲染；固定定位 + `pointer-events: none` + `mask-image` 淡出 |
| 开关 UI | `conversation.input.right` 槽位 | 通过 `remote.settings.update('mist-whale-theme', …)` 写入 |
| 人格 | `systemPrompt.section` | `text(context)` 按 `context.scope.id`（即会话 id）返回人格或空串 |

开关状态是 Host 侧声明的一个 volatile 配置项：

```js
export const Config = z.object({
  sessions: z.array(z.string()).default([]).volatile(),
});
```

`settings/document-updated`、页面刷新、重启都不需要额外同步：提示词在每次组装时读实时值。

## 目录结构

```text
.
├── index.js              # Host 半侧：Config、人格文本、prompt section
├── src/
│   └── client.template.js# Client 半侧源码（构建前，含图片占位符）
├── client.js             # 构建产物：浏览器实际加载的模块（图片已内联）
├── cordis.patch.yml      # bundle patch：插入插件行
├── locale/{en,zh}.json   # 插件管理器里显示的名称与描述
├── icon.svg              # 原创图标
├── assets/               # 壁纸素材（并不随 MIT 授权，见 NOTICE）
├── scripts/
│   ├── build-client.mjs  # 模板 + 图片 → client.js
│   └── crop.py           # 从海报裁出壁纸
└── test/
    └── host.test.mjs     # Host 逻辑的无浏览器单测
```

## 开发

```bash
pnpm install                 # 安装 @deepseek-ai/schemastery
node scripts/build-client.mjs # 修改 src/client.template.js 后重新生成 client.js
node test/host.test.mjs       # 会话隔离、空作用域等分支检查
python scripts/crop.py [海报路径] # 换素材后重裁，再执行构建
```

改完 `client.js`，DSH 页面会热加载新模块；改 Host 侧 `index.js` 需要在插件管理器里重新启用该行。

## 验证状态

- `test/host.test.mjs`：会话 A/B 的开关矩阵、无 scope、无 id 均通过
- 运行时检查：Config schema 为 volatile 数组、`conversation.input.right` 注册存在；开启会话时壁纸层才挂载（关闭时为 idle）
- 端到端：开启后该会话的系统提示中确实出现人格段落；关闭后消失
- 视觉细节（不同分辨率下的壁纸浓淡、按钮在窄窗口中的排布）未经像素级验证

## 已知限制

- 会话删除后其 id 会留在 `sessions` 数组里，需要手动关一次才会移除
- 壁纸是浮层上的半透明薄纱，而不是真正的窗口背景；这是 `shell.overlay` 的层级决定的
- 人格是会话级的，同一会话内的子代理默认不带
- 「最近会话」记在浏览器 localStorage（`dsh-wife-mode.last-session`），换浏览器或清空存储后会回到默认，直到再次打开会话

## 授权

代码 MIT（见 [LICENSE](LICENSE)）。海报立绘素材的授权另见 [NOTICE.md](NOTICE.md)——公开分发前请自行确认素材权利。

---

## English

A DSH Web client theme plugin: the mist-blue palette and right-edge wallpaper cropped from a
"Wife Mode" poster, plus a **per-conversation** Wife Mode switch in the composer that appends a
persona section (extracted from the poster) to that session's system prompt.

Both visual effects belong to the switch: the palette and the portrait appear while the
conversation most recently opened has Wife Mode on, stay in place on non-conversation panels
(Settings, Plugins) and after a reload, and are removed when another conversation without it is
opened or the switch is turned off.

- Palette: 14 alias tokens, light and dark pairs, applied through `ctx.theme.overrideTokens` while the current Session is on
- Wallpaper: a fixed, click-through band in `shell.overlay`, rendered only while the current Session is on
- Switch: `conversation.input.right`, state stored per Session id in the `sessions` settings array
- Persona: `systemPrompt.section` whose text is gated by `context.scope.id`

Install with `plugin_manager install_bundle` pointing at this directory, then run
`node scripts/build-client.mjs` after editing `src/client.template.js`, and `node test/host.test.mjs`
to check the session gating.

Code is MIT; the artwork is **not** covered — see [NOTICE.md](NOTICE.md).
