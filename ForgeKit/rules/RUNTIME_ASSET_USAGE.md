# ForgeKit：Runtime 资产使用说明

模型位于 `assets/legacy/generated/models/*.glb`；动画位于 `assets/legacy/generated/animations/*.anim.glb`。
全部为自包含 glTF 2.0 二进制资产，无外置纹理。+Y 上、+X 右、+Z 正面，1 单位=1 米。
约定 Pivot：人形双脚中心地面、建筑底面中心、武器主握点。实例可通过资产外层 Group 整体平移、旋转和缩放。

## 节点与 Metadata

资产包含命名为 Asset 的包装节点；Metadata 位于该节点的 glTF extras，Three.js 读取为 userData，**不是必然位于 gltf.scene.userData**。

| 字段 | 含义 |
| --- | --- |
| assetId, assetSchema, assetType | 资产标识；model.v1 / animation.v1；static / humanoid / fps_arms / animation |
| units, up, forward | meter、+Y、+Z |
| rigId, rigVersion, rigSignature | 人形和动画上存在；humanoid、字符串 "1" 或 "2"、对应 SHA-256 签名；FPS 使用独立 rigId |
| sockets | 模型中的 Socket 名称数组 |
| loop, duration | 动画循环标志、秒数 |
| positionEncoding | 动画为 canonical-local |
| canonicalTranslations | 动画对应骨架的标准默认局部位置，供跨比例播放修正 |

人形是刚性部件，无 Skin。v1 层级固定：Root → Body → Head / Arm_L / Arm_R / Leg_L / Leg_R。v2 在此基础上增加两侧 Forearm → Hand，以及 LowerLeg，共十三节点，详见 [v2 契约](HUMANOID_V2.md)。
节点 extras.bone=true；GLTFLoader 无 Skin 时可能返回普通 Object3D，不应仅通过 isBone 判断。
未播放时为 T-Pose：左臂 +X，右臂 -X，腿 -Y，正面 +Z。每个节点可直接挂多个 Mesh。
比例变化不改变 Rig Signature。默认严格比较 rigId、rigVersion、rigSignature。唯一跨版本例外是显式白名单桥接：v1 动画 → v2 模型，两端签名均须正确；反向、FPS 混用、任一字段缺失或未知签名仍拒绝。静态模型没有 Rig，不能播放人形动画。

## 加载与播放（Three.js）

下例使用工程随附的 `previewer/runtime.js`：以普通 script 加载，或在支持模块的 Runtime 中 side-effect import，API 位于 globalThis.ForgeRuntime。

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './previewer/runtime.js';
const R = globalThis.ForgeRuntime;
const loader = new GLTFLoader();
const model = await loader.loadAsync('assets/legacy/generated/models/simple_humanoid.glb');
const animation = await loader.loadAsync('assets/legacy/generated/animations/humanoid_walk.anim.glb');
scene.add(model.scene); // scene 是 Runtime 自己的 Three.js Scene
const modelMeta = R.metadata(model.scene);
const animationMeta = R.metadata(animation.scene);
R.captureRestPose(model.scene); // 刚加载时缓存；必须早于手动摆姿或播放
if (!R.compatibility(modelMeta, animationMeta)) throw new Error('Rig mismatch');
if (animation.animations.length !== 1) throw new Error('Expected one clip');

// 使用缓存的默认位置复制 Clip、重定平移基准，并补齐 v2 缺失关节轨道。
const clip = R.prepareClip(animation.animations[0], model.scene, animationMeta, THREE);
const mixer = new THREE.AnimationMixer(model.scene);
const action = mixer.clipAction(clip);
action.setLoop(animationMeta.loop ? THREE.LoopRepeat : THREE.LoopOnce,
               animationMeta.loop ? Infinity : 1);
action.clampWhenFinished = !animationMeta.loop;
action.play();
// 每帧调用 mixer.update(deltaSeconds)。动画文件的 scene 不加入渲染场景。

// 停止/切换前：恢复默认姿态并释放动作绑定。
function stop() {
  mixer.stopAllAction();
  mixer.uncacheRoot(model.scene);
  R.restoreRestPose(model.scene);
}
```

AnimationClip 在 `gltf.animations[0]`，名称为 assetId。节点旋转已经是标准 Quaternion 曲线。
为复用不同身高，位置曲线必须换算：
`目标位置关键帧 = 动画位置关键帧 − canonicalTranslations[bone] + 目标骨骼默认局部位置`。
`prepareClip` 已实现此换算；同一 Clip 可复制后用于多个角色。加载时 captureRestPose 缓存默认位置，不能把当前动画姿态当默认位置。直接切换时先 stop；crossfade 时使用缓存的 rest 准备新片段，不要在混合中重置模型。
所有动画 In Place，无 Root 位移。非循环完成时保持最后姿态；停止后恢复默认姿态。

`compatible(a,b)` 保持原有三字段严格一致语义。`compatibility(modelMeta, animationMeta)` 的参数顺序不可倒置，返回 `exact` / `humanoid-v1-to-v2` / `null`。`prepareClip` 会再次检查兼容性；对 v2 目标模型补齐缺失旋转及 Body.position，因此从屈肘转腕的 v2 片段混合回 v1 动画不会残留关节姿态。旧动画不会自动产生屈膝或转腕细节，需另作专用动作。

## Socket 与释放

```js
const weapon = await loader.loadAsync('assets/legacy/generated/models/test_weapon.glb');
const muzzle = weapon.scene.getObjectByName('muzzle');
if (!muzzle?.userData.socket) throw new Error('Missing muzzle socket');
scene.add(weapon.scene);
weapon.scene.updateMatrixWorld(true);
const worldPosition = muzzle.getWorldPosition(new THREE.Vector3());
// Socket 的 userData 同时含 socketId；可把效果节点直接挂到 muzzle 下。
```

切换/卸载时先停止 Mixer，移除模型，再遍历并 dispose Geometry、Material、Texture；共享资源由 Runtime 按引用计数管理。
Runtime 若从浏览器文件选择器获得 File，可用 `loader.parseAsync(await file.arrayBuffer(), '')`，无需 HTTP 服务。

## 独立 FPS 双臂

`fps-arms.v1` 使用独立 rigId=`fps-arms`，与 `humanoid` 不兼容；现有三字段检查、GLTFLoader 和 prepareClip 可直接复用。Root 是容器，四个关节为 UpperArm_L、Forearm_L、UpperArm_R、Forearm_R。无躯干、头、腿、手腕或手指骨骼，左侧在 +X（镜头沿 +Z 看时为画面左侧），朝前为 +Z。

`jointRotationEncoding=rest-local-x`、`degreesOfFreedomPerArm=2`。每个关节只绕默认基准的本地 X 轴旋转。动画导出已将默认基准乘入标准 Quaternion 曲线，播放时不要再次叠加；零动画增量就是模型默认准备姿态。FPS 禁止关节位移，也不能使用人形动作生成器。

玩家模型使用 Weapon_R（Forearm_R）挂所有武器，Weapon_L（Forearm_L）仅作左手支撑参考。Camera_FPS 挂 Root，采用相机 -Z 前向约定。模型默认 rigPose 可调整关节准备角度，现有动画仍覆盖该姿态。FPS 持枪动画已适配右手，FPS_ANIMATION_EVENTS.json version=5 对所有持物类别统一指定 Weapon_R。原预览器可选“预览武器”与相机点位同时检查。

FPS 持枪 stance 动画额外包含 UpperArm_L.position 摆位曲线，应同旋转轨道一起播放，不能只保留 quaternion。继续调用 prepareClip 按 canonicalTranslations 转换，禁止再次手动叠加 stance 偏移。收拿动作内已经包含过渡，停止动画后恢复模型默认摆位。

## 世界交互物

nodes.v1 支持静态模型同名 Part/Socket 动画，绝对局部 TRS，不使用人形平移重定基准。持久开启／耗尽状态、实例材质和独立效果控制器见 [节点动画契约](NODE_ANIMATIONS.md)。
