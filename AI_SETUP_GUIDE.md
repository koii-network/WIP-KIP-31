# AI Assistant Setup Guide

This guide explains how to properly configure AI coding assistants to work with the BTC-Koii repository in a way that adheres to project directives and plans.

## Claude Code Setup

Claude Code is Anthropic's command-line AI assistant that can help with coding tasks while adhering to project guidelines.

### Configuration Steps

1. **Initialization**:
   
   When starting a new Claude Code session, provide the configuration file:
   
   ```bash
   claude-code --config-file claude-code.config.json
   ```

2. **Guide Claude**:
   
   At the beginning of your session, inform Claude Code about the project directives:
   
   ```
   Before helping me with this project, please read the directives in /directives/*.md 
   and ensure all suggestions follow the project plan and directives.
   ```

3. **Reference Mode**:
   
   Enable reference mode to ensure Claude Code references plan documents:
   
   ```
   Please use reference mode and cite specific sections of the plan or directives
   when explaining your implementations.
   ```

## Cursor Setup

Cursor is an AI-powered code editor that can be configured to follow project directives.

### Configuration Steps

1. **Import Configuration**:
   
   In Cursor, navigate to Settings > AI Configuration and load the `cursor.config.json` file.

2. **Project Initialization**:
   
   When opening the project in Cursor, run this command in the AI chat:
   
   ```
   /analyze-project
   /read-files directives/*.md plan.md phase-0/plan.md
   ```

3. **Working Mode**:
   
   Set the AI to strict mode:
   
   ```
   /set-constraints "Follow BTC-Koii directives. Create plan_update.md for deviations. Never modify master plan."
   ```

## Using KNO SDK for AI Context

The repository includes KNO SDK integration that can be used to give AI agents better context about the project:

1. **Generate Embeddings** (if not already present):
   
   ```bash
   python generate_kno_embeddings.py
   ```

2. **Reference in AI Tools**:
   
   Both Claude Code and Cursor configurations are set to use these embeddings for context.

## Important Guidelines

When working with AI assistants on this project:

1. **Always mention the plan**:
   ```
   I want to implement feature X, which is specified in phase-0/plan.md section Y
   ```

2. **For deviations, explicitly request documentation**:
   ```
   We need to change approach for feature X due to obstacle Z. Please help me document 
   this in a plan_update.md file in the phase directory.
   ```

3. **Validate against directives**:
   ```
   Please ensure this implementation follows all directives, especially prevent_hallucinations.md
   ```

4. **Request plan references**:
   ```
   Explain how this implementation fulfills the requirements in the plan
   ```

Following these guidelines ensures AI assistants remain aligned with project directives and produce code that adheres to the established plan structure.