> 2026-11-08 开放试玩更新：后端 ALLOW_ALL_VERIFIED_EMAILS=true，接受所有由当前Access应用验证的邮箱。控制台AllowedPlayers需设置Allow + Include Everyone，保持One-time PIN，不能用Bypass。此前指定邮箱部署步骤保留为历史参考。内部新账号ID按团队issuer和规范化邮箱生成；已有邮箱记录继续使用原ID和进度。迁移0002为邮箱增加唯一索引。验证码实际投递仍需玩家测试；放开名单不代表邮件一定送达。

# 私有游戏：邮箱验证与云端存档

## 状态

Worker与D1已部署，Access应用及One-time PIN邮箱登录入口已配置。游戏网址：https://surgispace-private.surgispace-nephrectomy.workers.dev/ 。允许junweiliu960@gmail.com和jcknight1996@live.com。匿名请求网页、存档API及模型均验证跳转至surgispace.cloudflareaccess.com；登录页包含邮箱验证码输入方式。真实邮箱收码、认证后云端读写仍需获准邮箱本人完成最终验证。本地模拟账号测试已通过。原公开Pages已关闭。

## 账号注册

1. 打开 https://dash.cloudflare.com/sign-up ，注册并验证邮箱。
2. 登录 Cloudflare 控制台。不要购买域名或开通付费套餐。
3. 使用当前账号授权 Wrangler（在自己的浏览器中完成），不要把密码、验证码或 API 令牌发到聊天中。

## 生产部署顺序

1. 安装/使用官方 Wrangler 4，执行 `npx wrangler@4 login`。
2. `npx wrangler@4 d1 create surgispace-players`。将返回的 database_id 写入 wrangler.jsonc，不要自行编造。
3. `npx wrangler@4 d1 migrations apply surgispace-players --remote`，创建玩家与进度表。
4. 在 Cloudflare Zero Trust 中创建团队；添加 One-time PIN 登录方式。创建保护实际 Worker 域名的 Access 应用，包含所有路径；策略允许 junweiliu960@gmail.com 和 jcknight1996@live.com。禁用其他人员的允许策略和 bypass。
5. 将团队 issuer（https://团队名.cloudflareaccess.com）和该 Access 应用 AUD 写入 wrangler.jsonc。保持 ALLOWED_EMAILS 为指定邮箱列表。
6. 执行 `npm run build:private`，再 `npx wrangler@4 deploy`。不要使用普通静态构建替代私有构建。Worker 对所有路径（包括脚本和模型）校验 Access JWT；缺少配置或身份时拒绝访问。
7. 在生产 Worker 域名确认 Access 已启用，并禁用预览 URL。检查其他未保护的域名/路由；即使绕过 Access，Worker 仍会拒绝没有签名 JWT 的请求。
8. 使用无登录会话验证游戏、/api/progress 和模型路径均不能直接访问；获准邮箱验证后应能进入。用另一浏览器验证同一账号续玩；非白名单邮箱应被拒绝。
9. 如需 GitHub 自动私有部署，在 GitHub Actions 中使用只授权该 Cloudflare 账号所需 Worker/D1 的凭据。禁止重新启用旧公开 Pages 工作流。

wrangler.jsonc 已填写真实issuer/AUD并绑定D1数据库。真实部署时需用账号返回的真实值填写。Workers 静态资产每个文件须满足平台限制；当前人体网格和手术床单文件均小于25 MiB。

## 数据与接口

- players：经验证身份的哈希ID、邮箱、创建时间、最近登录时间。
- progress：玩家ID、版本号、完整稳定存档、更新时间。每个账号一个当前存档。
- GET /api/session：返回当前已验证用户。
- GET /api/progress：只读取当前用户的进度。
- PUT /api/progress：包含 snapshot、expectedRevision。服务端忽略浏览器传入的邮箱或玩家ID。
- 签名校验包含 RSA 签名、issuer、audience、过期时间、邮箱白名单；数据库使用参数化语句。
- 同时写入时，仅符合当前revision的一次写入成功；其他设备收到409，需明确读取云端进度。
- 完成题目、失败、重试、开始任务时保存；每30秒及页面隐藏时保存稳定节点。动画中断从操作前节点恢复。
- 断网时本机使用按账号区分的备份。恢复网络后可重试；发现版本冲突则不自动覆盖。冲突备份保留在该账号独立浏览器键中。
- 更换邮箱会被视为另一个登录身份；当前没有账号合并功能。存档版本为3，后续升级需保留迁移逻辑。

## 本地开发与测试

Node.js 22.16+（支持 node:sqlite；建议24）。

```
npm ci
npm test
npm run build:private
npm run backend:dev
```

本地 http://127.0.0.1:5190 使用固定模拟账号，不发送验证码，不是对外部署服务器。监听仅在127.0.0.1，检查Host；SQLite写入被.gitignore排除的.local目录。生产Worker不导入此开发入口。

浏览器集成检查：`node tools/backend-browser-check.cjs`，需配置 PLAYWRIGHT_MODULE 与本机浏览器；测试只验证本地后端，不声称真实邮件已送达。

## 旧进度

新云端自动读取同一账号此前成功保存的进度。原ChatGPT Sites域名或另一设备上的旧localStorage无法跨域自动读取；旧本机存档不会被删除，主菜单提供显式导出/导入第3版进度文件，不会擅自归给登录账号。旧域名需先使用包含导出入口的版本；未升级的旧网页可继续保留原进度，不能自动从新域名读取。第2版24节点存档不兼容本关20节点。
