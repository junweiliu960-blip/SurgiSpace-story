# 林先生 Lux3D 坐姿资产清理

复用原 `public/models/lux3d-patient/clinic-patient.glb`，保留林先生原有精细头部、服装和纹理，不新增生成任务。原文件保持不变。

- `tools/prepare-lin-seated.py` 从融合网格中切除原椅子的靠背、座面和椅腿，去除切割残片，并补齐交界处的表面。
- 对手掌、手腕附近的原始表面进行局部平滑，收整多余的尖锐褶皱，保留原贴图 UV。
- 清理版输出至 `public/models/lux3d-patient/lin-seated-clean.glb`；同名 JSON 记录源文件及输出哈希、手部处理数量和零新增付费任务。
- `src/lux3d-lin.js` 为诊疗室和剧情中的林先生加载同一清理版，更新头部对话锚点，并在场景销毁时取消尚未完成的接入。
- `src/photo-layout.js` 按清理版的髋部及脚底位置校准坐姿，只使用背景图片中的椅子；第二病例的年轻患者保持独立外观。
- 已核对独立诊疗室及 T05 林先生与小黄同场画面。测试检查来源哈希、内嵌贴图及移除椅子后的网格开口。

本次仅本地存档，不上传 GitHub 或更新线上版本。

效果截图位于项目父目录 `output/SurgiSpace-lin-lux3d-chair-free.jpg`。
