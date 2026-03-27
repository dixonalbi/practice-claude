import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolStatusLabel, ToolCallStatus } from "../ToolCallStatus";

afterEach(() => {
  cleanup();
});

// --- Pure function tests: str_replace_editor ---

test("getToolStatusLabel: create in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")
  ).toBe("Creating /App.jsx");
});

test("getToolStatusLabel: create complete", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")
  ).toBe("Created /App.jsx");
});

test("getToolStatusLabel: str_replace in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, "call")
  ).toBe("Editing /App.jsx");
});

test("getToolStatusLabel: str_replace complete", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, "result")
  ).toBe("Edited /App.jsx");
});

test("getToolStatusLabel: insert in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "insert", path: "/utils.js" }, "call")
  ).toBe("Editing /utils.js");
});

test("getToolStatusLabel: insert complete", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "insert", path: "/utils.js" }, "result")
  ).toBe("Edited /utils.js");
});

test("getToolStatusLabel: view in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, "call")
  ).toBe("Reading /App.jsx");
});

test("getToolStatusLabel: view complete", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, "result")
  ).toBe("Read /App.jsx");
});

test("getToolStatusLabel: undo_edit in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, "call")
  ).toBe("Reverting /App.jsx");
});

test("getToolStatusLabel: undo_edit complete", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, "result")
  ).toBe("Reverted /App.jsx");
});

test("getToolStatusLabel: unknown editor command in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "something", path: "/App.jsx" }, "call")
  ).toBe("Using editor on /App.jsx");
});

test("getToolStatusLabel: unknown editor command complete", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "something", path: "/App.jsx" }, "result")
  ).toBe("Used editor on /App.jsx");
});

// --- Pure function tests: file_manager ---

test("getToolStatusLabel: rename in-progress", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, "call")
  ).toBe("Renaming /old.jsx → /new.jsx");
});

test("getToolStatusLabel: rename complete", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, "result")
  ).toBe("Renamed /old.jsx → /new.jsx");
});

test("getToolStatusLabel: delete in-progress", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "delete", path: "/trash.jsx" }, "call")
  ).toBe("Deleting /trash.jsx");
});

test("getToolStatusLabel: delete complete", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "delete", path: "/trash.jsx" }, "result")
  ).toBe("Deleted /trash.jsx");
});

test("getToolStatusLabel: unknown file_manager command in-progress", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "list", path: "/" }, "call")
  ).toBe("Managing /");
});

test("getToolStatusLabel: unknown file_manager command complete", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "list", path: "/" }, "result")
  ).toBe("Managed /");
});

// --- Edge cases ---

test("getToolStatusLabel: missing path defaults to 'file'", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create" }, "call")
  ).toBe("Creating file");
});

test("getToolStatusLabel: missing command on str_replace_editor", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { path: "/App.jsx" }, "call")
  ).toBe("Using editor on /App.jsx");
});

test("getToolStatusLabel: empty args object", () => {
  expect(
    getToolStatusLabel("str_replace_editor", {}, "call")
  ).toBe("Using editor on file");
});

test("getToolStatusLabel: undefined args", () => {
  expect(
    getToolStatusLabel("str_replace_editor", undefined, "call")
  ).toBe("Using editor on file");
});

test("getToolStatusLabel: missing new_path on rename defaults to 'new location'", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "rename", path: "/old.jsx" }, "call")
  ).toBe("Renaming /old.jsx → new location");
});

test("getToolStatusLabel: unknown tool returns tool name", () => {
  expect(
    getToolStatusLabel("some_random_tool", { command: "x" }, "call")
  ).toBe("some_random_tool");
});

test("getToolStatusLabel: unknown tool in result state returns tool name", () => {
  expect(
    getToolStatusLabel("some_random_tool", {}, "result")
  ).toBe("some_random_tool");
});

test("getToolStatusLabel: partial-call state shows in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, "partial-call")
  ).toBe("Creating /App.jsx");
});

test("getToolStatusLabel: undefined state shows in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create", path: "/App.jsx" })
  ).toBe("Creating /App.jsx");
});

test("getToolStatusLabel: file_manager with undefined args", () => {
  expect(
    getToolStatusLabel("file_manager", undefined, "call")
  ).toBe("Managing file");
});

// --- Component rendering tests ---

test("ToolCallStatus renders spinner for call state", () => {
  const { container } = render(
    <ToolCallStatus
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("ToolCallStatus renders check icon for result state", () => {
  const { container } = render(
    <ToolCallStatus
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(container.querySelector(".text-emerald-500")).not.toBeNull();
  expect(screen.getByText("Created /App.jsx")).toBeDefined();
});

test("ToolCallStatus renders spinner for partial-call state", () => {
  const { container } = render(
    <ToolCallStatus
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/App.jsx" },
        state: "partial-call",
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
});

test("ToolCallStatus has correct styling classes", () => {
  const { container } = render(
    <ToolCallStatus
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "delete", path: "/trash.jsx" },
        state: "result",
      }}
    />
  );

  const pill = container.firstChild as HTMLElement;
  expect(pill.className).toContain("bg-neutral-50");
  expect(pill.className).toContain("rounded-lg");
  expect(pill.className).toContain("border-neutral-200");
  expect(pill.className).not.toContain("font-mono");
});

test("ToolCallStatus renders rename with both paths", () => {
  render(
    <ToolCallStatus
      toolInvocation={{
        toolName: "file_manager",
        args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        state: "result",
      }}
    />
  );

  expect(screen.getByText("Renamed /old.jsx → /new.jsx")).toBeDefined();
});
