# Projects

用于集中管理多个独立项目的总仓库。

![Repository Type](https://img.shields.io/badge/Repo-Portfolio-blue)
![Projects](https://img.shields.io/badge/Projects-1-0f766e)
![Primary Project](https://img.shields.io/badge/Featured-Dualens-c2410c)
![Status](https://img.shields.io/badge/Status-Active-1d4ed8)

这里不把所有代码混在一起，而是按“一个项目一个一级目录”的方式组织。仓库根目录负责导航，每个子项目各自维护源码、文档、依赖和运行说明。

## 仓库定位

- 集中管理和导航多个项目
- 每个项目独立成目录，方便单独演示、运行和扩展
- 根 README 负责概览，子项目 README 负责细节

## Featured Project

> ### Dualens / 两仪决
> 一个面向复杂决策场景的双智能体辅助决策系统。
>
> 它会先围绕用户问题搜索资料、抽取共享证据，再让两个数字员工基于同一组资料展开多轮辩论，最后输出结构化决策总结。
>
> - 目录：[`dualens/`](./dualens)
> - 项目说明：[`dualens/README.md`](./dualens/README.md)
> - 技术栈：Next.js 15、React 19、TypeScript、Tailwind CSS、Vitest、Playwright
> - 当前状态：可本地运行，已完成研究 -> 辩论 -> 总结闭环

## Project Index

| Project | What it is | Stack | Status | Link |
| --- | --- | --- | --- | --- |
| Dualens / 两仪决 | 双智能体辅助决策系统 | Next.js, React, TypeScript | Active | [`./dualens`](./dualens) |

## Why this repo is structured this way

这种结构适合作品集仓库，原因很直接：

- 每个项目有清晰边界，不会因为互相影响把仓库搞乱
- 后续新增项目时，不需要重做仓库结构
- 面试、简历或项目展示时，别人一进仓库就能看见“总览 + 代表作”
- 以后如果某个项目要单独拆出去，也比较容易迁移

## Run the featured project

```bash
cd dualens
pnpm install
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

## Repository Layout

```text
Projects/
  README.md
  dualens/
    README.md
    docs/
    src/
    tests/
    package.json
```

## Add the next project

后续新增项目时，直接在仓库根目录新增一级目录即可，例如：

```text
Projects/
  dualens/
  ai-notes/
  tool-experiment/
  data-playground/
```

推荐每个项目目录至少包含：

- `README.md`
- `src/`
- `docs/`（可选）
- `package.json` 或对应语言/框架的项目配置
