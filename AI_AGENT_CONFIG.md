# AI Agent Configuration for BTC-Koii

This document outlines the configuration process for AI assistants like Claude Code and Cursor when working with this repository. The goal is to ensure AI agents adhere to the project's directives and prevent hallucinations or deviations from the plan.

## Purpose

AI agents can be extremely helpful for development, but they need specific guidance to:

1. Adhere strictly to the project's documented plans and directives
2. Avoid implementing features not specified in the plans
3. Handle edge cases like technical obstacles appropriately
4. Maintain consistent documentation of any plan updates

By providing explicit configuration instructions for different AI assistants, we can ensure consistent behavior across different development environments and tools.

## Process Overview

The configuration process involves:

1. Creating structured configuration files for each AI assistant
2. Embedding directive knowledge in the project's `.kno` directory
3. Providing clear instructions for developers to initialize AI assistants properly
4. Ensuring directives are discoverable by AI agents during code exploration

This approach allows directives to be both human-readable (in the `/directives` folder) and AI-accessible through embeddings and configuration.

## Implementation Plan

The implementation will:

1. Create configuration files for Claude Code and Cursor
2. Add directive embeddings to the `.kno` directory
3. Document the setup process for developers
4. Ensure no interference with phase folder structures

This implementation maintains separation between directives and implementation code while ensuring AI agents have access to the necessary guidelines.