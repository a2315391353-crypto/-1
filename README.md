# 年货玩具厂·螺丝擂台（微信小游戏）

本项目是 Canvas 2D 微信小游戏，支持“擂台赛比拼（异步挑战）”玩法，并预留官方擂台赛组件接入位置。适用于春节“社交比拼玩法”激励活动（激励①，无需报名）。

## 目录结构
- `game.js`：小游戏入口（仅三行 require）。
- `game.json`：小游戏配置。
- `project.config.json`：开发者工具项目配置，`miniprogramRoot` 指向小游戏根目录。
- `js/main.js`：主逻辑（状态机 + 渲染 + 输入 + 挑战链路）。
- `js/arena/arena.js`：擂台赛组件适配层（所有组件调用集中在这里）。
- `js/api/cloud.js`：云函数封装。
- `cloudfunctions/*`：云函数代码与配置。

## 从零创建并运行
1. 使用微信开发者工具创建 **小游戏基础模板** 项目。
2. 将本仓库文件复制覆盖到该项目根目录。
3. 打开微信开发者工具，确认 `project.config.json` 的 `miniprogramRoot` 为 `./`。
4. 点击「编译」或按 **F5** 运行。

## 开通并接入擂台赛组件
1. 在 MP 后台按官方入口开通并添加“擂台赛能力组件”。
2. 对照官方擂台赛组件开发指南，将 `js/arena/arena.js` 中的 TODO 调用与字段 **替换/对齐**。
3. 在结算页使用「发起擂台挑战」按钮创建挑战并分享；分享回流后进入挑战预览页再应战。

## 自定义编译条件模拟挑战回流
1. 打开开发者工具 → 「编译」下拉 → 「添加编译模式」。
2. 选择小游戏项目，勾选「自定义启动参数」。
3. 在启动参数中填写：
   ```
   challengeId=mock123&seed=12345&difficulty=1&boardId=B
   ```
4. 编译后将进入「挑战预览页」。

## 云开发配置
1. 在开发者工具中开通云开发并创建环境。
2. 修改 `js/api/cloud.js` 中的 `CLOUD_ENV` 为你的云环境 ID。
3. 上传并部署 `cloudfunctions` 下的所有云函数。
4. 在云数据库创建集合：
   - `users`
   - `runs`
   - `challenges`
   - `leaderboards_daily`

### 集合字段建议
- `runs`：`openId`, `score`, `durationMs`, `tapCount`, `seed`, `difficulty`, `boardId`, `riskLevel`, `createdAt`
- `challenges`：`creatorOpenId`, `creatorScore`, `opponentOpenId`, `opponentScore`, `seed`, `difficulty`, `boardId`, `status`, `outcome`, `createdAt`, `updatedAt`
- `leaderboards_daily`：`dateKey`, `boardId`, `score`, `openId`, `runId`, `createdAt`

## 上线前检查清单
- 分享回流链路：创建挑战 → 分享 → 回流识别 → 预览 → 应战 → 提交成绩。
- 擂台赛组件接入：`arenaAdapter` 中所有 TODO 均已按官方文档对齐。
- 云函数权限与集合规则配置完成（避免写入失败）。
- 反作弊校验逻辑符合当前玩法规则。
- 隐私合规提示与用户授权流程在正式版本中补齐。

## 玩法说明
- 15 秒拆螺丝计分，连击加分。
- 误点冻结 0.35 秒并清空连击。
- 金螺丝需先拆“红点钥匙螺丝”解锁。
- 今日三擂台固定题板 A/B/C（同日同题）。

> 注意：本项目不包含开放数据域，也不使用排行榜子域。
