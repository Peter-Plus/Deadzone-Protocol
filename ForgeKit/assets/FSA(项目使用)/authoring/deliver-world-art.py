# -*- coding: utf-8 -*-
from pathlib import Path
import json, shutil, hashlib
fire=Path(__file__).resolve().parents[4];fk=fire/'ForgeKit';game=fire/'Deadzone Protocol';fsa=fk/'assets/FSA(项目使用)'
def append(path,text):
    p=Path(path);s=p.read_text(encoding='utf-8-sig')
    if text.strip().splitlines()[0] not in s:p.write_text(s.rstrip()+'\n\n'+text.strip()+'\n',encoding='utf-8')
append(fk/'rules/environment/TERRAIN.md','''2026-10-06 正式荒漠扩展：terrain 可选 `landform=flat|slope|basin|hill`，分别生成微起伏、X 向缓坡、椭圆浅洼和低丘；amplitude 为地貌尺度，seed/wavelength 控制附加低频起伏。省略保持原样件算法。可选 `edgeBlend` 指定收至 y=0 的边缘过渡宽度，最外一格保持全平，平台连同过渡区不得与边缘带重叠。字段纳入严格 schema，不支持手写顶点。正式四块为 112×112m、1m 网格、相同沙色，按 112m 网格平移可使边缘高度与边界法线一致；这是资源约定，不是地图生成实现。不同尺寸、cell、高度基准或任意地形仍需另外处理接缝。''')
append(fk/'rules/environment/BARRIER.md','''2026-10-06 正式围挡：FSA Quarantine 高 2.8m，Protected 高 4m，连续阻挡厚度均为 0.25m。铁栏 `ContinuousBlocker` 是明确声明的 opacity=0 Box，供角色和子弹整段阻挡；它不是可射穿的透明材质规则。运行时必须读取契约碰撞，不能仅射线检测可见栏杆。其余柱、基座、横梁也有保守 Box。直段 6m、转角两臂各 3m、收边 1m；连接高/厚只能在同套资源内匹配。

`*.assembly.json` 使用独立 `environment-preview-assembly.v1`，记录静态 barrier 实例的 asset、position、yaw（度）及 gateSlots 门位标注。环境 build 将它们嵌入同一个离线预览并复制到 references，不导出整圈正式模型，不加入模型清单。这是制作参考，游戏尚无该组装格式消费器。门位标线不是门框/门扇实物，保护区大门由独立门项提供后再验证动态装配。''')
rows=[]
for batch in ['terrain','barriers']:
    src=fsa/'generated/world/environments'/batch;dst=game/'Assets/world/environments'/batch
    for p in src.rglob('*'):
        if p.is_file() and p.name!='EnvironmentPreview.html':
            target=dst/p.relative_to(src);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target);assert p.read_bytes()==target.read_bytes()
    manifest=json.loads((src/'environment-manifest.json').read_text(encoding='utf-8'))
    for item in manifest['assets']:
        c=json.loads((src/item['contract']).read_text(encoding='utf-8'))
        assert hashlib.sha256((src/c['modelAsset']).read_bytes()).hexdigest()==item['modelHash']
        assert hashlib.sha256((fsa/'definitions/environments'/batch/(c['id']+'.environment.json')).read_bytes()).hexdigest()==item['sourceHash']
        model=f'world/environments/{batch}/'+c['modelAsset'];contract=f'world/environments/{batch}/'+item['contract']
        assert (game/'Assets'/model).is_file() and (game/'Assets'/contract).is_file()
        note='112×112m，1m 网格；48×44m 连续地形平台。' if batch=='terrain' else ('连续阻挡角色与子弹，视觉栏缝不可射穿。' if 'Quarantine' in c['id'] else '不透明铁板墙，角色与子弹阻挡。')
        rows.append(f'| {c["label"]} | {"地形高度场" if batch=="terrain" else "静态模块围挡"} | `{model}` | {note} 契约：`{contract}`。 |')
append(game/'Assets/模型动画资产配置表.md','''## 荒漠地形与区域围挡（2026-10-06）

10 个正式静态模型及配套 environment.v1 契约已入库，2026-10-06 获用户美术验收（含地形配色修订）；无动画。modelAsset 按各批次 terrain/barriers 目录解析。两份组合参考只在预览中组装，不登记为固定整圈模型。

| 资产游戏内对应名称 | 类型 | 资产路径（相对 Assets） | 备注 |
| --- | --- | --- | --- |
'''+ '\n'.join(rows)+'''

批次清单：`world/environments/terrain/environment-manifest.json`、`world/environments/barriers/environment-manifest.json`。制作结果与预览分别见[地形工作项](../Production/Plan/Art/05-完成项/20-荒漠地形与建造平台.md)、[围挡工作项](../Production/Plan/Art/05-完成项/22-区域围挡与保护区铁墙.md)。资产目录不限制地区混配；正式地图生成、物理、子弹和导航消费均待程序接入。''')
append(game/'Assets/模型资产使用说明.md','''### 荒漠地形与区域围挡（2026-10-06）

10 个模型的逐项路径以配置表为准。米制、+Y 上、+Z 前、scale=1。terrain/barriers 各自保留 models、contracts、environment-manifest.json 相对路径；围挡 references 仅为制作组合参考，游戏尚不能消费该组装格式。两批都没有动画。

地形使用契约中的 terrain.heights 构建同源三角网格碰撞；数组按 Z 行/X 列排列，格点索引 a、b=a+1、c=a+columns、d=c+1，三角形为 (a,c,d)/(a,d,b)。高度查询复用 ForgeKit terrainSupport 的同三角形插值，不使用双线性插值；局部范围外返回无支持面，实例平移后先逆变换查询。法线由同一高度三角形决定，子弹应检测地表三角网格。四块边缘最外一格高度为零，按 112m 网格、同 y 平移拼接，不叠加薄板补缝。不得改变缩放或随意旋转改变高度场消费方式。

每块可建造平台 X=[-24,24]、Z=[-21,23]，平地/缓坡高 0、浅洼 -1.4、低丘 2m；建筑整个 reservation 与门外落脚区必须落在平台内，建筑根 y=平台高−建筑地板顶面本地高，使最终入口高差≤0.10m。当前两款大型军事建筑 reservation 已逐一核对，均可放置于平台；其他建筑按真实占地检查。平台和 16m 过渡带均直接生成于同一连续地形网格，不是覆盖地板。改变平台尺寸/中心/高度需改源并重新编译验坡，不能只更新元数据。

围挡整段阻挡角色和子弹。Quarantine 通透栏杆的 ContinuousBlocker 为 opacity=0 的实际 Box，碰撞契约保留连续阻挡体；射击不可仅测试可见栏杆网格。Protected 为不透明铁板。两类都按契约分段创建 Box，包含柱脚和横梁；不要将整个 L 转角包围盒作为实心碰撞。围挡根 y 对齐平整地面，允许绕 Y 旋转，不能拉伸贴坡；保护区整圈和门收纳范围先形成同高场地，并另查外侧坡地是否可绕过墙顶。

同套直段、转角、收边通过 connectors 匹配。连接标称厚度 .25m，立柱/收边实际深度可达 .50m，placement 已包含这些凸出。保护区两门位仅为待门项装配的接口，当前开口不能视为封闭关门状态；尺寸和收纳建议见围挡工作项。后续运行时必须消费门进度对应的移动碰撞及导航，资产交付不表示游戏接入。''')
print('Synced 10 models, 10 contracts, 2 manifests, 2 assembly references; hashes match.')
