"use client";

import { CheckIcon } from "lucide-react";
import { useState, useMemo } from "react";

// Generate large mock data to simulate performance issues
const generateLargeData = (size: number) => {
  const data: Record<string, string> = {};
  for (let i = 0; i < size; i++) {
    data[`field_${i}`] = `This is a long string with lots of data ${"x".repeat(100)} - item ${i}`;
  }
  return data;
};

// Simple mock tool component for testing
function MockToolOutput({ 
  toolName, 
  argsText, 
  result 
}: { 
  toolName: string; 
  argsText: string; 
  result: Record<string, string> 
}) {
  const [showFullArgs, setShowFullArgs] = useState(false);
  const [showFullResult, setShowFullResult] = useState(false);

  const formattedResult = useMemo(() => {
    return JSON.stringify(result, null, 2);
  }, [result]);

  const truncatedArgs = useMemo(() => {
    if (argsText.length <= 1000) return { text: argsText, isTruncated: false };
    return { text: argsText.slice(0, 1000) + "...", isTruncated: true };
  }, [argsText]);

  const truncatedResult = useMemo(() => {
    if (formattedResult.length <= 1000) return { text: formattedResult, isTruncated: false };
    return { text: formattedResult.slice(0, 1000) + "...", isTruncated: true };
  }, [formattedResult]);

  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
      <div className="flex items-center gap-2 px-4">
        <CheckIcon className="size-4" />
        <p className="flex-grow">
          Used tool: <b>{toolName}</b>
        </p>
      </div>
      <div className="flex flex-col gap-2 border-t pt-2">
        <div className="px-4">
          <p className="font-semibold mb-2">Arguments:</p>
          <pre className="whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
            {showFullArgs ? argsText : truncatedArgs.text}
          </pre>
          {truncatedArgs.isTruncated && (
            <button
              onClick={() => setShowFullArgs(!showFullArgs)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showFullArgs ? "Show less" : "Show more..."}
            </button>
          )}
        </div>
        <div className="border-t border-dashed px-4 pt-2">
          <p className="font-semibold mb-2">Result:</p>
          <pre className="whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
            {showFullResult ? formattedResult : truncatedResult.text}
          </pre>
          {truncatedResult.isTruncated && (
            <button
              onClick={() => setShowFullResult(!showFullResult)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showFullResult ? "Show less" : "Show more..."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestPerformancePage() {
  const [toolCount, setToolCount] = useState(10);

  // Generate mock tool calls with large data
  const mockTools = Array.from({ length: toolCount }, (_, i) => ({
    id: `tool-${i}`,
    toolName: `MockTool_${i}`,
    argsText: JSON.stringify(generateLargeData(50), null, 2),
    result: generateLargeData(100),
  }));

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Tool Output Performance Test</h1>
        <p className="mb-4">
          This page tests the performance optimizations for rendering many tool outputs.
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setToolCount(5)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            5 Tools
          </button>
          <button
            onClick={() => setToolCount(10)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            10 Tools
          </button>
          <button
            onClick={() => setToolCount(20)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            20 Tools
          </button>
          <button
            onClick={() => setToolCount(50)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            50 Tools (Stress Test)
          </button>
        </div>

        <div className="bg-green-100 dark:bg-green-900 p-4 rounded mb-6">
          <h2 className="font-bold mb-2">Optimizations Applied:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Content truncated to 1000 characters by default</li>
            <li>&quot;Show more/less&quot; buttons for full content</li>
            <li>useMemo caches expensive JSON.stringify operations</li>
            <li>max-h-96 height constraints with scrolling</li>
            <li>React.memo prevents unnecessary re-renders</li>
          </ul>
        </div>

        <p className="text-lg font-semibold">
          Currently rendering: <span className="text-blue-600">{toolCount}</span> tool outputs
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Each tool has ~50 fields in args and ~100 fields in result (large data)
        </p>
      </div>

      <div className="space-y-4">
        {mockTools.map((tool) => (
          <MockToolOutput
            key={tool.id}
            toolName={tool.toolName}
            argsText={tool.argsText}
            result={tool.result}
          />
        ))}
      </div>
    </div>
  );
}
