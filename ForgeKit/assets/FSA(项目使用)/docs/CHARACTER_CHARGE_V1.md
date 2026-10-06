# 角色共用循环蓄力动作

## 交付文件

- 源定义：`definitions/animations/characters/shared/FSA_ANIM_Character_Charge.anim.json`
- 成品：`generated/animations/characters/shared/FSA_ANIM_Character_Charge.anim.glb`
- 片段 ID：`FSA_ANIM_Character_Charge`；时长 1.20 秒，循环。

动作使用 `humanoid.v1` 七节点骨架，双臂稍抬、头部微俯，胸肩作小幅循环起伏。首尾旋转相同，原地播放，不含攻击命中、投射物或伤害事件。当前 A1～A4、B1～B3 和商人罗德都可按同名节点绑定；具体技能是否使用这段中性蓄力姿态由内容配置决定。举斧、持杖或左手插地等强姿态可另配专用动作。

游戏应让动画循环至技能配置的蓄力结束，取消或受击时切换到 Hit 或角色专用受击。动画时长不决定技能时长，GLB 本身不提交 Gameplay 效果。

2026-10-02：与八个现有七节点角色在 ForgeKit 原预览器中加载验证；全 FSA 定义库 51 份通过校验、编译。
