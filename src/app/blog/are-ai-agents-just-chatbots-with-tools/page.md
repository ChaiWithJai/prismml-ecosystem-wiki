---
title: "Are AI agents just chatbots with tools?"
description: "No. Agentic behavior is a systems property built from a loop, tools, and memory, and a small local model in a ReAct loop shows exactly where it breaks."
audience: researcher
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, front matter chapter map, Ch. 8 summary"
status: published
last_reviewed: 2026-07-07
---

No. Agentic behavior is a systems property built from a loop, tools, and memory, and it is separate from raw model scale. That makes it testable on small local models. A 1 to 2 GB model in a ReAct loop with one tool shows you exactly where the loop breaks, and that is more instructive than watching a frontier model succeed. {% .lead %}

## Separate the loop from the model

Marily Nika's Building AI-Powered Products gives Chapter 8 to agents, and the front matter chapter map says the chapter covers autonomous agents, multi-agent systems, and their use in real products. The chapter has a section titled "Not Just Glorified Chatbots", and its argument is a decomposition, not a size claim. Nika writes that ChatGPT on its own is not an agent because it "needs explicit input, lacks a goal-driven framework, and doesn't act within an environment" (Ch. 8). She lists the parts that make a system an agent: abilities, goals, prior knowledge, stimuli, and past experiences.

For a researcher, the useful reading of that list is that every part except one lives outside the model weights.

- The loop is code you write. It calls the model, parses a tool call out of the reply, runs the tool, and appends the result to the transcript.
- The tool is code you write, plus the format the model must emit to call it.
- The memory is the transcript itself, which grows every turn.
- The model is the only part that changes when you change scale.

So agentic behavior is a property of the whole system, and you can hold the loop, the tool, and the memory fixed while you swap the model. That turns "is this an agent problem or a model problem" from an opinion into an ablation. A ReAct loop is the simplest version of this system. The model writes a short reasoning step, then either a tool call or a final answer, the loop runs the tool and appends the result, and the cycle repeats.

## Work one task through the loop

Here is the worked example. Give the system one tool, a calculator, and this task: "What is 12.5 percent of the sum of 384 and 416?"

The correct trace has two tool calls. First the model calls the calculator with 384 + 416 and reads back 800. Then it calls the calculator with 800 * 0.125 and reads back 100. Then it answers 100. You can check the arithmetic by hand, since 384 + 416 = 800 and one eighth of 800 is 100.

Now count what the model must carry. As a rough estimate, a system prompt that explains the tool format takes about 300 tokens, and each turn adds about 120 tokens of reasoning, tool call, and tool result. By the final answer the model is reading about 300 + 3 * 120 = 660 tokens of history, and it must keep three facts straight inside that history: the original question, the first result (800), and which step it is on.

When I run this task with a 1.5B parameter model, the failures cluster at turn two. The model reuses 800 as the final answer, or it emits a tool call with a missing quote so the parser rejects it, or it recomputes 384 + 416 again because it lost track of which step it was on. A frontier model on the same loop almost always produces the clean two-call trace. That contrast is the data. The small model did not fail randomly. It failed at state tracking, at tool call formatting, and at recovery after a rejected call, and each of those points at a different part of the system.

## Sort each failure into one of three causes

Each failure in your log belongs to one of three causes, and each cause has a different fix.

- Loop design. The loop fed the wrong thing back, let the model answer before the tool returned, or had no retry after a bad parse. The fix is loop code. Adding one retry with the parser error shown to the model often recovers the formatting failures on its own.
- Tool interface. The format you demanded is hard for the model to emit, e.g., strict nested JSON. The fix is a simpler format, such as a single line like `CALC: 384 + 416`.
- Model capability. The loop is correct and the format is simple, and the model still loses the thread. The fix is a bigger or better model, and nothing you do to the loop will patch it.

A frontier model hides the first two causes because it recovers from awkward formats and sloppy loops. The small model surfaces them, which is why the small model is the better instrument for studying the loop itself.

## Try it

This takes about 25 minutes. No GPU is needed. A 1.5B model quantized to 4 bits is about 1 GB and runs on a laptop CPU.

1. Install llama.cpp and start a local server with a small model:

   ```bash
   brew install llama.cpp
   llama-server -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M --port 8080
   ```

2. Hand-roll the loop. Do not use an agent framework, because the point is to own every line. The loop is about 30 lines of Python: post the transcript to `http://localhost:8080/v1/chat/completions`, look for a line starting with `CALC:` in the reply, evaluate the expression, append the result as a new message, and repeat up to 5 turns. Your system prompt defines the `CALC:` format and tells the model to write `ANSWER:` when done.
3. Run the percentage task from the worked example 10 times and log every transcript.
4. Swap in a larger model on the same loop and rerun. [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) works as the larger local model, and as a rough estimate it needs about 6 GB of memory on CPU. A hosted frontier model through an API also works if you have a key.
5. Label every failed transcript with one cause: loop design, tool interface, or model capability. The test for each label is the fix. If a loop change would have saved the run, it is loop design. If a simpler format would have, it is tool interface. Otherwise it is model capability.

## Check yourself

- **Where did the small model fail most often?** Expected answer: at turn two, on state tracking or on tool call formatting, not on the arithmetic itself. The calculator does the arithmetic.
- **Which failures disappeared when you added a retry that shows the parser error?** Expected answer: most of the formatting failures. Those were loop design failures, not model failures, even though they looked like model failures at first.
- **Did the larger model succeed because it is more agentic?** Expected answer: no. It ran the same loop with the same tool and the same memory. It succeeded because the model part of the system is stronger, which is exactly the separation the exercise demonstrates.
- **What would you change first to help the small model, and why?** Expected answer: the tool interface, because a simpler format removes a whole failure class for free, and model capability is the most expensive part to change.

## Next steps

- Read the [llama.cpp ecosystem page](/docs/ecosystem/llama-cpp) for what the runtime does and how the server flags work.
- Read the [inference stack overview](/docs/concepts/inference-stack) to see where the loop you wrote sits relative to the runtime and the model.
- For choosing between the runtimes you just used, read [Ollama vs llama.cpp](/blog/ollama-vs-llama-cpp).

When you can do this, you can decompose agent failures into systems causes and model causes using a small model testbed.
