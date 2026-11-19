# 2026-11-19 第一台手术资产、连续术野和公开部署

## 已实现
- 第二病例手术入口明确提示点击右上手术大屏，进入腹腔镜后保留视图跨题推进；主动返回手术室仍可重新进入。
- 同一问诊或手术阶段保留 canvas、renderer、人物与器官实例，仅替换题目和对白界面，避免反复卸载、下载和重建人物。
- 用户确认参考图后，通过 Aholo Lux3D 提交且仅提交三项 G1 任务：人体手术床铺巾整体、肾脏完整结构、内部剖面；每项请求 100000 面、PBR、GLB。原始与导出哈希、任务编号在 public/models/lux3d-renal-refresh/provenance.json。
- 新整体用于第一病例手术全景与术前过场；完整与剖面用于主线和结构学习。背景移去空床，避免两张床叠加。原始资产保留。
- 配准肾动脉至腹主动脉、肾静脉至下腔静脉；右肾动脉在下腔静脉后方走行。肾上腺保持独立保留。肾门短接口衔接既有 BodyParts3D 血管，模型的颜色和形状仅辅助教学。
- Cloudflare Workers + Static Assets，D1 提供免登录访客独立存档。公开入口剥离外来身份头，Cookie 为 HttpOnly/Secure/SameSite=Lax；D1 原子条件写避免旧进度覆盖新进度。

## 构建与发布
npm ci
npm test
npm run build
npx wrangler whoami
npx wrangler deploy

数据库已创建并初始化，配置绑定在 wrangler.jsonc。新账户部署应创建自己的库、调整 account_id/database_id，再执行 worker/cloudflare-schema.sql。不要向 GitHub 上传本机认证、.local/、.wrangler/、API key 或玩家存档。

## 参考图提示词与生成方式
使用内置图像生成工具：按 65 岁男性、开放右侧根治性肾切除、右肾中下部近肾门约 8 cm 肿块绘制概念图；拆为无文字、无场景的手术床人体整体、完整肾脏、肾脏剖面三张建模参考图。参考图位于 public/images/lux3d-renal-refresh/。
手术室背景编辑：仅移除中央空手术床、床影和底座，重建地面，保留手术灯、器械台、监护仪和建筑位置，用于放入新三维整体。

## 解剖依据
https://www.ncbi.nlm.nih.gov/books/NBK459158/
https://www.ncbi.nlm.nih.gov/books/NBK538298/
