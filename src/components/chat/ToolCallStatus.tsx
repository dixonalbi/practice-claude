import { Loader2, Check } from "lucide-react";

type ToolInvocationState = "partial-call" | "call" | "result";

interface ToolInvocation {
  toolName: string;
  args?: Record<string, string>;
  state: ToolInvocationState;
  [key: string]: unknown;
}

interface ToolCallStatusProps {
  toolInvocation: ToolInvocation;
}

export function getToolStatusLabel(
  toolName: string,
  args?: Record<string, string>,
  state?: ToolInvocationState
): string {
  const done = state === "result";
  const path = args?.path || "file";

  if (toolName === "str_replace_editor") {
    const command = args?.command;
    switch (command) {
      case "create":
        return done ? `Created ${path}` : `Creating ${path}`;
      case "str_replace":
      case "insert":
        return done ? `Edited ${path}` : `Editing ${path}`;
      case "view":
        return done ? `Read ${path}` : `Reading ${path}`;
      case "undo_edit":
        return done ? `Reverted ${path}` : `Reverting ${path}`;
      default:
        return done ? `Used editor on ${path}` : `Using editor on ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command;
    switch (command) {
      case "rename": {
        const newPath = args?.new_path || "new location";
        return done
          ? `Renamed ${path} → ${newPath}`
          : `Renaming ${path} → ${newPath}`;
      }
      case "delete":
        return done ? `Deleted ${path}` : `Deleting ${path}`;
      default:
        return done ? `Managed ${path}` : `Managing ${path}`;
    }
  }

  return toolName;
}

export function ToolCallStatus({ toolInvocation }: ToolCallStatusProps) {
  const { toolName, args, state } = toolInvocation;
  const label = getToolStatusLabel(toolName, args, state);
  const isDone = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
