<div align="center">

</div>

项目名称： Research-Copilot：基于多 Agent 与长链推理的自动化文献深度研读与综述引擎
项目定位： 面向科研人员与 R&D 工程师的学术提效基础设施。
1. 核心业务痛点：
目前科研人员和算法工程师每天面临严重的“学术信息过载”。
筛选成本极高： 每天 Arxiv 上新增成百上千篇论文，人工精读一篇需要 2-3 小时，但 80% 的论文可能只有一段方法论有参考价值。
总结归纳困难： 在撰写文献综述（Literature Review）或调研竞品技术时，需要横向对比数十篇论文的 Dataset（数据集）、Baseline（基线模型）和 Metrics（评估指标），人工提取极易错漏且耗时。
语言与认知门槛： 对于非母语研究者，长篇英文长难句和复杂的数学推导极大阻碍了对核心 SOTA（前沿）技术的理解。
2. 核心逻辑流与架构（长链推理与多 Agent 协作）：
本项目并非简单的“把 PDF 丢给 AI 总结大意”，而是构建了一个符合学术审稿标准的流水线：
触发与解析： 用户上传 PDF 或输入 Arxiv 链接，系统利用大窗口能力加载全文文本。
Agent 1【结构化拆解员】： 负责全文速读，精准剥离并提取论文的元数据（作者/机构）、核心研究动机（Motivation）和贡献点（Contributions）。
Agent 2【方法论审稿专家（长链推理）】： 模拟顶会审稿人（Reviewer）的思维链（CoT），对提取的方法论和实验数据进行深度剖析。推理路径为：它解决了什么前人未解决的问题？-> 它的网络架构或核心公式创新在哪？-> 实验是否充分？-> 结论是否有局限性（Limitations）？
Agent 3【综述与知识沉淀助手】： 接收前两者的结构化数据，自动生成结构清晰的母语化“学术阅读笔记”，并可一键提取关键字段生成 JSON/CSV，方便用户直接导入 Notion 或 Excel 形成文献矩阵。
1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
