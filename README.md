# Projects

一个用于承载多个独立项目的总仓库。

当前仓库采用一级目录收纳多个项目的方式，每个项目都在自己的子目录中维护代码、文档和运行配置。这样可以在同一个 GitHub 仓库里集中展示作品，同时保持每个项目的边界清晰。

## 当前项目

### Dualens / 两仪决

位置：[`dualens/`](./dualens)

一个双智能体辅助决策系统。它会先搜索资料、提取共享证据，再让两个数字员工围绕同一问题进行多轮辩论，最后输出结构化决策总结。

- 项目说明：[`dualens/README.md`](./dualens/README.md)
- 技术栈：Next.js 15、React 19、TypeScript、Tailwind CSS、Vitest、Playwright
- 适合展示方向：AI Product、Multi-Agent Workflow、Decision Support、RAG Debate

## 运行当前项目

```bash
cd dualens
pnpm install
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

## 仓库结构

```text
Projects/
  README.md
  dualens/
    README.md
    src/
    docs/
    package.json
```

## 后续扩展方式

后续如果要继续加入新项目，直接在仓库根目录新增一级子目录即可，例如：

```text
Projects/
  dualens/
  another-project/
  tool-experiment/
```

每个项目各自维护：

- 源码
- README
- 文档
- 依赖与配置

这样仓库根目录只负责导航，不承担具体项目实现。
