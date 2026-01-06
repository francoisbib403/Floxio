import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface AIRequest {
  message: string;
  currentWorkflow?: {
    id: string;
    name: string;
    nodes: string;
    edges: string;
  } | null;
}

interface AIResponse {
  message: string;
  workflow?: {
    nodes: any[];
    edges: any[];
  };
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `You are an expert workflow designer assistant. Your role is to help users create and modify workflows.

A workflow consists of:
- Nodes: Represent steps or actions (start, action, condition, end)
- Edges: Represent connections between nodes (CRITICAL: Always create edges to connect nodes)

Node types:
1. "start" - The entry point of workflow (MUST be first node)
2. "action" - A step that performs an action
3. "condition" - A decision point that branches the flow
4. "end" - The termination point of workflow (MUST be last node)

When responding:
1. First, provide a friendly and helpful message to the user
2. If the user wants to create or modify a workflow, generate appropriate nodes AND edges
3. ALWAYS create edges to connect nodes in a logical flow (start → actions → conditions → end)
4. Return the response in this exact JSON format:
{
  "message": "Your helpful message to the user...",
  "workflow": {
    "nodes": [
      {
        "id": "node-1",
        "type": "custom",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "Node Label",
          "description": "Optional description",
          "type": "start|action|condition|end",
          "config": {}
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ]
  }
}

If you're only providing information or answering a question (not creating/modifying), only include the "message" field in your response.

CRITICAL REQUIREMENTS:
- ALWAYS create edges to connect nodes - disconnected workflows are invalid
- Always include a start node and an end node for complete workflows
- Create a linear or branching flow from start to end
- Connect each node to at least one other node (except end node)
- Position nodes in a logical flow (left to right or top to bottom)
- Keep labels concise and clear (max 20-30 characters)
- Use consistent ID naming (node-1, node-2, edge-1, edge-2, etc.)
- For conditions, create multiple outgoing edges for different outcomes
- Return ONLY valid JSON - no markdown formatting, no code blocks`;

// Helper function to read env variables from .env.local file
function getEnvVar(key: string, defaultValue: string = ''): string {
  if (process.env[key]) {
    return process.env[key] || '';
  }

  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [name, ...valueParts] = trimmed.split('=');
        if (name === key) {
          return valueParts.join('=').trim();
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read ${key} from .env.local:`, error);
  }

  return defaultValue;
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();
    const { message, currentWorkflow } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = getEnvVar('OPENROUTER_API_KEY');
    const model = getEnvVar('OPENROUTER_MODEL', 'x-ai/grok-code-fast-1');

    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('Model:', model);
    console.log('Reading from .env.local:', !process.env.OPENROUTER_API_KEY);

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      return NextResponse.json(
        { message: "Désolé, le service IA n'est pas configuré correctement." },
        { status: 500 }
      );
    }

    // Build context for the AI
    let context = '';
    if (currentWorkflow) {
      try {
        const nodes = JSON.parse(currentWorkflow.nodes);
        const edges = JSON.parse(currentWorkflow.edges);
        context = `\n\nCurrent workflow:\n- Name: ${currentWorkflow.name}\n- Nodes: ${JSON.stringify(nodes, null, 2)}\n- Edges: ${JSON.stringify(edges, null, 2)}`;
      } catch (error) {
        console.error('Failed to parse current workflow:', error);
      }
    }

    // Prepare messages for OpenRouter
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `User request: ${message}${context}`,
      },
    ];

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Workflow Builder',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { message: "Désolé, une erreur est survenue lors de la communication avec l'IA." },
        { status: response.status }
      );
    }

    const data: OpenRouterResponse = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Parse the AI's JSON response
    let aiResponse: AIResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, just return the message
        aiResponse = { message: aiMessage };
      }
    } catch (error) {
      // If JSON parsing fails, just return the raw message
      aiResponse = { message: aiMessage };
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Failed to process AI request:', error);
    return NextResponse.json(
      {
        message: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
