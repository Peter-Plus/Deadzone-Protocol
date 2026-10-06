# Fire 工作区

本目录包含正式游戏项目、独立的模型资产生成工具，以及已弃用内容的备份。

## 目录说明

| 目录 | 用途 | 定位 |
| --- | --- | --- |
| [Deadzone Protocol](./Deadzone%20Protocol/) | 正式游戏项目 | 游戏开发、运行时逻辑及正式项目内容均以此目录为准。 |
| [ForgeKit](./ForgeKit/) | 模型资产生成工具 | 独立工具，与运行时游戏项目无关，不属于游戏运行时项目。 |
| [Legacy](./Legacy/) | 弃用内容的备份 | 仅用于历史留存，不作为当前开发或运行的依据。 |

## 工作约定

- 修改游戏时，进入 `Deadzone Protocol`，先阅读其中的 `README.md` 和 `AGENTS.md`。
- 修改模型资产生成工具时，进入 `ForgeKit`，参考该目录的 `README.md`。
- 不要将 `ForgeKit` 或 `Legacy` 误认为正式游戏项目，也不要将 `Legacy` 中的旧实现作为当前项目实现。
