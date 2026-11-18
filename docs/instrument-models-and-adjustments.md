# 器械模型交付与后续调整说明

本页记录器械模型交付阶段。0.2.0已把器械练习与清点接入八阶段学习任务，并增加结构探索、续学与复盘；整体版本及37项验收见[核心体验说明](core-experience-audit.md)。

更新日期：2026-10-26。本轮完成器械台全部12件本地GLB的接入，保留分类、搜索、详情、取用、抓持示意、开合、归还与组件清点。手术床默认及复位仍为平躺。

## 已完成的模型

| 编号 | 器械 / 文件名 | 目标长度 | 本版来源和处理 |
| --- | --- | --- | --- |
| INS-01 | 手术刀柄 / scalpel-handle.glb | 14cm | Lux3D Turbo白模，校正朝向、尺寸、厚度与金属材质 |
| INS-02 | 手术刀片 / scalpel-blade.glb | 4.5cm | Turbo白模，人工开通被填平的安装槽 |
| INS-03 | Mayo剪 / mayo-scissors.glb | 17cm | 保留已完成的Turbo试用模型，三部件演示分件 |
| INS-04 | Metzenbaum组织剪 / metzenbaum-scissors.glb | 18cm | Turbo白模，尺寸校正、三部件演示分件 |
| INS-05 | 蚊式止血钳 / mosquito-hemostat.glb | 12.5cm | 保留AI工作端；人工重建封闭环柄、柄部和铰轴 |
| INS-06 | Kelly止血钳 / kelly-hemostat.glb | 16cm | Turbo白模，尺寸校正、三部件演示分件 |
| INS-07 | Kocher有齿止血钳 / kocher-clamp.glb | 16.5cm | 第一版弃用；第二版保留AI工作端，人工重建环柄及铰轴，添加小型齿标识 |
| INS-08 | Adson镊 / adson-forceps.glb | 12cm | Turbo白模，校正握持端朝向与尺寸 |
| INS-09 | DeBakey镊 / debakey-forceps.glb | 20cm | Turbo白模，校正握持端朝向与尺寸 |
| INS-10 | Mayo-Hegar持针器 / mayo-hegar.glb | 16cm | 保留AI工作端；人工重建环柄、柄部和铰轴 |
| INS-11 | Langenbeck拉钩 / langenbeck.glb | 21cm | AI候选出现错误分叉，未采用；按参考图人工重建环形柄、平直柄和单个弯钩 |
| INS-12 | 手术吸引管 / suction-tip.glb | 22cm | Turbo白模，校正整体尺寸、厚度与材质 |

长度为游戏内统一尺度，不等同于参考产品的精确规格。完整几何、比例、牙纹和握持仍需专业人员复核。面板对人工重建的拉钩、修正环柄的三件器械分别标注来源，没有将它们标成未经修改的AI成品。

## 免费额度与素材

沿用用户指定的Turbo极速版、Mesh、100K最低档，关闭额外PBR贴图；后续直接上传公开产品照片，没有再生成参考图。

本轮新增11件生成任务，另免费重做1次Kocher：共使用12次免费任务。余额300积分保持不变，免费次数由27降至15，实际扣积分0。包括此前Mayo试用在内，共使用15次免费任务，其中包含最初的参考图、标准版试验与Turbo试验。未购买套餐、充值或提交额外付费贴图。

参考图片来源、Lux3D资产ID与文件哈希见同目录的`instrument-model-provenance.json`。厂家和经销商图片用于本次形状参考，不随游戏打包；公开可访问不等于获得商业再分发授权。正式对外发布前，应核对参考素材及生成平台的适用授权。游戏运行不访问这些网站，也不需要Lux3D账号。

## 队友如何看到同样版本

在含`package.json`的仓库根目录执行：

```powershell
git status
git pull --ff-only
npm.cmd ci
npm.cmd test
npm.cmd run dev -- --host 127.0.0.1
```

有自己的修改时先保存在功能分支，避免覆盖。ZIP用户重新下载仓库到新文件夹。打开终端实际显示的Local网址，按Ctrl+F5刷新，关闭介绍后点“器械台 · 12件”。成功应显示“已加载GLB 12件 / 12件”。选中器械后可取用G、开始练习、归还R；C进入清点。各自的积分与昵称是浏览器本地存档，不会随GitHub同步。

本次未增加npm依赖；运行游戏无需安装Blender。若要编辑网格，可在Blender导入仓库内对应GLB，保留部件命名后再次导出。

## 潜在调整空间与修改位置

| 优先级 | 调整方向 | 位置 / 操作 | 调整后如何检查 |
| --- | --- | --- | --- |
| 高 | 修整钳口、牙纹、锁扣与接缝；细化Mayo-Hegar的短工作端、Adson较宽握持段、DeBakey细纹、吸引管管腔及控制孔 | Blender编辑`public/models/surgical_instruments/instruments/`内GLB；当前AI网格不是医学准确的标准器械 | 正面、侧面、底面检查；由熟悉器械的队员对照实物；避免仅凭名称验收 |
| 高 | 更精确的环柄开合与铰轴位置 | 保持`arm-a`、`arm-b`、`pivot`命名；把两臂几何的共同铰轴放在模型原点 | 开始练习后观察两臂是否绕同一铰轴转动，是否穿插或断裂；分别模拟部件缺失 |
| 高 | 握持位置及手形 | `src/instrument-catalog.js`内`assetGrips`；`src/instrument-models.js`的`createGripHand` | 取用并练习，从不同角度看手与柄是否穿插。绿色环是握持提示，不是器械的金属结构 |
| 中 | 单件比例、朝向、台面摆放 | catalog中的`length`、`modelScale`、`modelRotation`、`initialPosition`、`initialRotation`。`length`仅记录目标，不会自动缩放已导出的GLB | `npm.cmd test`；检查是否浮空、埋入台布、越界或与邻件重叠 |
| 中 | 不锈钢反光、粗糙度、颜色 | Blender材质；准备脚本中的`Metallic`与`Roughness`。目前为统一金属白模，没有额外PBR贴图 | 房间光照及放大持握两种状态下检查，避免高光掩盖轮廓 |
| 中 | 开合幅度、速度、展示倍率与归还节奏 | `src/instrument-table.js`的`syncModels`、练习动画及`hold`相关代码 | 连续取用/归还，保持一次仅一件；检查槽位数量、归还动画和清点状态 |
| 中 | 性能与下载体积 | Blender减面、合并材质、增加LOD；保留环孔及部件边界。100K是生成档位，不表示每件最终三角面恰好100K | 在较弱电脑观察旋转和开合流畅性、首次加载时间；减面后重新跑测试并看孔洞 |
| 低 | 布局、字体和小屏展示 | `src/instrument-table.css`。内容区使用`instrument-table-body`，避免与设备外壳样式同名 | 两台电脑分别检查面板滚动、按钮可点击、中文不被裁切 |
| 后续 | 增加器械、状态保存和病例联动 | catalog、`instrument-state.js`及任务模块 | 新增后同步部件数量、清点规则与测试；不要只加一条图片或文件路径 |

环柄动画目前是几何分件后的示意旋转，部分工作端仍为生成模型的合并或粗糙网格；锁扣没有实际锁合物理，镊子没有真实弹性模拟，吸引管没有流体模拟，刀柄与刀片不演示装配。当前重点是外形识别和交互流程，不能把面板标签当成已精确实现的几何细节。

## 资源结构与处理脚本

运行资源均为自包含GLB，不依赖单独的贴图文件。六件环柄器械包含`arm-a`、`arm-b`、`pivot`；其他为单个`body`组件。加载器先检查全部组件，再替换程序化占位；失败会提示并保留可交互占位。

可选处理脚本：`scripts/prepare-lux-instrument.py`。它需要Blender自带Python与NumPy，命令示例：

```powershell
blender -b --python scripts/prepare-lux-instrument.py -- INPUT.glb OUTPUT_DIR metzenbaum-scissors .18 scissors .72
```

脚本用于从原始Lux3D下载网格生成校正GLB、Blender工程和预览，不应反复用于已处理的成品。Mayo剪保留此前单独处理版本。本机原始下载、失败候选、参考照片、`.blend`与逐件预览保存在项目外层的`output/lux3d-instruments/`，不属于游戏运行依赖；仓库GLB本身可在Blender导入继续编辑。

## 验收

自动测试28项：12件真实GLB解析、米制尺寸、部件存在、台布间隙及台面边界；加载失败保留占位、高亮恢复；单件持有、归还、缺件和阶段清点；原平躺床与五个关节回归测试。构建通过；原有大JS包提示仍在，可后续拆包优化。

浏览器实测记录见`instrument-model-verification.json`。不同分辨率、两台电脑的显卡性能及完整48病例流程尚需队员继续验收。建议先按上表“高”优先级收集截图和问题，再集中做第二轮外形精修。
