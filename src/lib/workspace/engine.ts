import { ProjectWorkspaceData } from "./types";

export const SAMPLE_PROJECT_WORKSPACE: ProjectWorkspaceData = {
  id: "workspace-demo-1",
  title: "Glassmorphic Kanban Task Board",
  description: "A reactive multi-file task board with drag-and-drop state, localStorage sync, and vibrant dark glass theme.",
  previewType: "html",
  activeFilePath: "index.html",
  files: [
    {
      name: "index.html",
      path: "index.html",
      language: "html",
      isEntry: true,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kanban App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-zinc-950 text-white min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto">
    <header class="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Project Sprint Board</h1>
        <p class="text-xs text-zinc-400">Pair-programmed with My AI Human Assistant</p>
      </div>
      <button id="add-btn" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold shadow-lg shadow-indigo-500/30 transition">+ Add Task</button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="board">
      <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800" data-col="todo">
        <h2 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">To Do</h2>
        <div class="space-y-2" id="col-todo"></div>
      </div>
      <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800" data-col="in-progress">
        <h2 class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">In Progress</h2>
        <div class="space-y-2" id="col-in-progress"></div>
      </div>
      <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800" data-col="done">
        <h2 class="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Done</h2>
        <div class="space-y-2" id="col-done"></div>
      </div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
    },
    {
      name: "style.css",
      path: "style.css",
      language: "css",
      content: `/* Custom glass cards & transitions */
.task-card {
  background: rgba(24, 24, 27, 0.8);
  border: 1px solid rgba(63, 63, 70, 0.6);
  backdrop-filter: blur(8px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.task-card:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 8px 24px -4px rgba(99, 102, 241, 0.2);
}`,
    },
    {
      name: "app.js",
      path: "app.js",
      language: "javascript",
      content: `const initialTasks = [
  { id: '1', title: 'Design system tokens & variables', col: 'done' },
  { id: '2', title: 'Implement WebSocket delta stream', col: 'in-progress' },
  { id: '3', title: 'Write unit tests for authentication', col: 'todo' }
];

function render() {
  document.getElementById('col-todo').innerHTML = '';
  document.getElementById('col-in-progress').innerHTML = '';
  document.getElementById('col-done').innerHTML = '';

  initialTasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card p-3 rounded-xl text-xs flex justify-between items-center cursor-pointer';
    card.innerHTML = '<span>' + task.title + '</span>';
    document.getElementById('col-' + task.col).appendChild(card);
  });
}

document.getElementById('add-btn').addEventListener('click', () => {
  const title = prompt('Enter task name:');
  if (title) {
    initialTasks.push({ id: Date.now().toString(), title, col: 'todo' });
    render();
  }
});

render();`,
    },
  ],
};

export function buildWorkspaceBundleSrcDoc(workspace: ProjectWorkspaceData): string {
  const htmlFile = workspace.files.find((f) => f.name.endsWith(".html") || f.isEntry);
  const cssFiles = workspace.files.filter((f) => f.name.endsWith(".css"));
  const jsFiles = workspace.files.filter((f) => f.name.endsWith(".js") || f.name.endsWith(".ts"));

  let html = htmlFile ? htmlFile.content : `<!DOCTYPE html><html><body><div id="root"></div></body></html>`;

  // Inject CSS inline
  const cssContent = cssFiles.map((c) => `<style>\n${c.content}\n</style>`).join("\n");
  if (cssContent) {
    html = html.replace("</head>", `${cssContent}\n</head>`);
  }

  // Inject JS inline
  const jsContent = jsFiles.map((j) => `<script>\n${j.content}\n</script>`).join("\n");
  if (jsContent) {
    html = html.replace("</body>", `${jsContent}\n</body>`);
  }

  return html;
}

export function parseWorkspaceMarkdown(rawText: string): ProjectWorkspaceData {
  try {
    const trimmed = rawText.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return {
        ...SAMPLE_PROJECT_WORKSPACE,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }

  return SAMPLE_PROJECT_WORKSPACE;
}
