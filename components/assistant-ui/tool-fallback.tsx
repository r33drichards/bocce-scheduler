import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { useState, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";

const MAX_STRING_LENGTH = 10000;
const MAX_LINES = 500;
const MAX_ARRAY_ITEMS = 100;
const MAX_OBJECT_KEYS = 100;

function truncateString(str: string): { truncated: string; wasTruncated: boolean } {
  if (str.length <= MAX_STRING_LENGTH) {
    return { truncated: str, wasTruncated: false };
  }
  return {
    truncated: str.substring(0, MAX_STRING_LENGTH) + "\n... (truncated)",
    wasTruncated: true,
  };
}

function truncateObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return "[Max depth reached]";

  if (Array.isArray(obj)) {
    if (obj.length <= MAX_ARRAY_ITEMS) {
      return obj.map(item => truncateObject(item, depth + 1));
    }
    return [
      ...obj.slice(0, MAX_ARRAY_ITEMS).map(item => truncateObject(item, depth + 1)),
      `... (${obj.length - MAX_ARRAY_ITEMS} more items)`,
    ];
  }

  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length <= MAX_OBJECT_KEYS) {
      return Object.fromEntries(
        keys.map(key => [key, truncateObject((obj as Record<string, unknown>)[key], depth + 1)])
      );
    }
    return Object.fromEntries([
      ...keys.slice(0, MAX_OBJECT_KEYS).map(key =>
        [key, truncateObject((obj as Record<string, unknown>)[key], depth + 1)]
      ),
      ["_truncated", `... (${keys.length - MAX_OBJECT_KEYS} more keys)`],
    ]);
  }

  return obj;
}

function formatResult(result: unknown): { formatted: string; wasTruncated: boolean } {
  if (typeof result === "string") {
    const { truncated, wasTruncated } = truncateString(result);
    return { formatted: truncated, wasTruncated };
  }

  try {
    const truncated = truncateObject(result);
    const jsonStr = JSON.stringify(truncated, null, 2);
    const lines = jsonStr.split("\n");

    if (lines.length <= MAX_LINES) {
      return { formatted: jsonStr, wasTruncated: false };
    }

    return {
      formatted: lines.slice(0, MAX_LINES).join("\n") + "\n... (truncated)",
      wasTruncated: true,
    };
  } catch (e) {
    return { formatted: "[Error formatting result]", wasTruncated: false };
  }
}

const ToolFallbackComponent: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showFullResult, setShowFullResult] = useState(false);
  const isComplete = result !== undefined;

  const { formatted, wasTruncated } = useMemo(() => {
    if (result === undefined) return { formatted: "", wasTruncated: false };
    return formatResult(result);
  }, [result]);

  const displayResult = useMemo(() => {
    if (!showFullResult || !wasTruncated) return formatted;

    // For full result, still apply some limits to prevent complete crashes
    if (typeof result === "string") {
      return result.length > 50000 ? result.substring(0, 50000) + "\n... (content too large)" : result;
    }

    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return formatted;
    }
  }, [formatted, wasTruncated, showFullResult, result]);

  return (
    <div className="aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        {isComplete ? (
          <CheckIcon className="aui-tool-fallback-icon size-4" />
        ) : (
          <Loader2Icon className="aui-tool-fallback-icon size-4 animate-spin" />
        )}
        <p className="aui-tool-fallback-title flex-grow">
          {isComplete ? "Used" : "Using"} tool: <b>{toolName}</b>
        </p>
        <Button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          <div className="aui-tool-fallback-args-root px-4">
            <pre className="aui-tool-fallback-args-value whitespace-pre-wrap">
              {argsText}
            </pre>
          </div>
          {result !== undefined && (
            <div className="aui-tool-fallback-result-root border-t border-dashed px-4 pt-2">
              <p className="aui-tool-fallback-result-header font-semibold">
                Result:
              </p>
              <pre className="aui-tool-fallback-result-content whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {displayResult}
              </pre>
              {wasTruncated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullResult(!showFullResult)}
                  className="mt-2"
                >
                  {showFullResult ? "Show less" : "Show full result"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ToolFallbackComponent.displayName = "ToolFallback";

export const ToolFallback = memo(ToolFallbackComponent);
