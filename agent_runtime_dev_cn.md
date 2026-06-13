# 开发者起步稿：从 OpenClaw 思路到自建 LLM API 实现

## 这份文档解决什么问题

这不是上线治理手册，也不是大而全的架构规范。

这份文档的目标是：

1. 给开发者一个可落地的起步思路（先做什么、后做什么）。
2. 解释必须理解的核心知识点（简要版）。
3. 给出可以直接看的官方文档入口。
4. 说明 OpenClaw 常见概念如果自己做，底层如何用 LLM API 实现（含伪代码）。

## 一、开发基本思路（先把最小闭环做出来）

建议按下面顺序推进，不要一开始就做“全能 agent”。

### Step 1：先选一个小场景

选一个语言任务明确、收益清楚的场景，例如：

- 工单分类
- 长文本摘要
- 非结构化文本抽取为结构化字段

标准：

- 输入清晰
- 输出可定义
- 成败可评估

### Step 2：定义输入输出合同

先写清楚：

- 输入字段是什么
- 输出字段是什么
- 输出字段类型是什么
- 哪些字段是必填

如果输出合同都没定义，先不要进入实现。

### Step 3：跑通一次最小 API 调用

先只做最简单链路：

- 接收输入
- 调 LLM API
- 返回结构化输出
- 失败时返回明确错误

### Step 4：加入校验与回退

最小回退策略就够：

- 输出不合法 -> 重试一次
- 仍不合法 -> 返回 fallback 结果（或进入人工处理）

### Step 5：再加工具调用（如确实需要）

先把“纯文本推理”场景跑稳，再引入 tool calling。

### Step 6：最后才扩展到多步骤编排

多 agent、多工具、多阶段流程是后续能力，不是起点能力。

## 二、必须掌握的核心知识点（简要）

### 1) Chat/Responses API

本质是：

- 输入 messages 或 input
- 输出文本或结构化结果

你需要先熟悉请求结构、参数、返回结构。

### 2) Structured Output（结构化输出）

核心价值：

- 让模型按你定义的 schema 返回
- 降低后处理复杂度

这是把功能接入业务系统的关键能力。

### 3) Function/Tool Calling

核心机制：

- 模型不会直接执行工具
- 模型只返回“要调用哪个工具、参数是什么”
- 你的程序执行工具，再把结果回填给模型

### 4) Streaming

在交互场景中提升体验，用于增量展示输出。

### 5) Embeddings + RAG（后续）

当你需要基于企业知识库问答时再做。

### 6) 评估与可观测性（起步也要有）

起步阶段至少要记录：

- 成功率
- 输出校验失败率
- 平均延迟
- 每次调用成本

## 三、OpenClaw 概念 -> 自建时如何用 LLM API 做

下面是“概念映射”，帮助你把 OpenClaw 的思路落到自己的代码里。

| OpenClaw 概念 | 自建时对应做法 | 底层能力 |
| --- | --- | --- |
| Agent | 写一个循环：模型输出 -> 判断是否调用工具 -> 回填结果 -> 继续 | Chat/Responses + Tool Calling |
| Tool | 定义工具 schema，并在服务端实现执行器 | Function/Tool Calling |
| Model Routing | 按任务类型选模型，失败时切换 fallback 模型 | 多 provider + 路由逻辑 |
| Session/Memory | 存会话历史与业务上下文，按需注入 prompt | 数据库/缓存 + prompt 拼装 |
| Plugin | 把工具封装成模块并统一注册 | 工具注册表 + 权限控制 |
| Workspace Context | 先检索相关文档再拼入上下文 | RAG（检索 + 重排 + 拼接） |
| Structured Output | 给定 schema 并强校验，不通过就重试/回退 | JSON schema 输出约束 |
| Gateway | 所有 LLM 调用经过统一服务入口 | 鉴权、限流、日志、审计 |

## 四、关键伪代码（可直接作为开发草图）

### 1) 最小调用（结构化输出）

```pseudo
function classifyTicket(ticketText):
    request = {
        model: selectModel("classification"),
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: ticketText }
        ],
        response_schema: TicketSchema
    }

    result = llm.chat(request)

    if !validate(result, TicketSchema):
        retryResult = llm.chat(request with stricter_prompt)
        if !validate(retryResult, TicketSchema):
            return fallback("manual_review")
        return retryResult

    return result
```

### 2) Agent Loop（工具调用版）

```pseudo
function runAgent(userInput):
    messages = [{ role: "user", content: userInput }]

    while true:
        response = llm.chat({
            model: selectModel("agent"),
            messages: messages,
            tools: TOOL_DEFINITIONS
        })

        if response.hasToolCalls():
            for call in response.toolCalls:
                if !isAllowed(call.name):
                    messages.append(toolError("tool_not_allowed"))
                    continue

                toolResult = executeTool(call.name, call.arguments)
                messages.append(toolMessage(call.id, toolResult))
            continue

        return response.text
```

### 3) 模型路由 + 回退

```pseudo
function selectModel(taskType):
    if taskType == "classification":
        return "fast-cheap-model"
    if taskType == "analysis":
        return "high-quality-model"
    return "default-model"

function callWithFallback(request):
    try:
        return providerA.chat(request)
    catch error:
        log("providerA_failed", error)
        return providerB.chat(request)
```

### 4) 最小网关模式

```pseudo
HTTP POST /ai/classify:
    authCheck()
    rateLimitCheck()
    redactedInput = redactSensitiveData(request.body)

    result = classifyTicket(redactedInput.text)

    auditLog({
        route: "/ai/classify",
        model: result.model,
        latency_ms: result.latency,
        cost: result.cost,
        success: result.success
    })

    return result
```

## 五、建议的学习顺序（两周起步版）

### 第 1-3 天：API 基础

- 跑通 5-10 次基础调用
- 理解请求参数与返回结构

### 第 4-6 天：结构化输出

- 做一个“输入文本 -> 输出 JSON”的小功能
- 加输出校验与重试

### 第 7-9 天：工具调用

- 定义 1-2 个工具
- 跑通一次完整 tool calling 回路

### 第 10-12 天：网关化

- 把调用封装成内部 API
- 加最小日志和失败回退

### 第 13-14 天：评估与复盘

- 看成功率、失败率、成本、延迟
- 调整 prompt、schema、模型路由

## 六、文档入口（先看这些）

### OpenAI

- API 概览：https://platform.openai.com/docs/api-reference
- Chat Completions：https://platform.openai.com/docs/api-reference/chat
- Responses API：https://platform.openai.com/docs/api-reference/responses
- Function Calling：https://platform.openai.com/docs/guides/function-calling
- Structured Outputs：https://platform.openai.com/docs/guides/structured-outputs
- Embeddings：https://platform.openai.com/docs/guides/embeddings

### Anthropic

- Messages API：https://docs.anthropic.com/en/api/messages
- Tool Use：https://docs.anthropic.com/en/docs/build-with-claude/tool-use

### MCP

- 官方站点：https://modelcontextprotocol.io/

## 七、开发者结论（当前阶段）

你现在最该做的不是“做一个复杂 agent 平台”，而是：

1. 找一个小场景做最小闭环。
2. 用 LLM API 跑通结构化输出。
3. 在必要时加工具调用。
4. 用最小可观测性把质量和成本看清楚。
5. 再逐步演进成你自己的企业集成层。

一句话：
先把一个用例做对，再把一类用例做稳，最后再考虑平台化。
