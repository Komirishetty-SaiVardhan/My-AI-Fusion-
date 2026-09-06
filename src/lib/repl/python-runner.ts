import { PythonExecutionResult } from "./types";

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    __pyodideInstance?: any;
    __pyodideLoadingPromise?: Promise<any>;
  }
}

const PYODIDE_CDN_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/";

/**
 * Load Pyodide WebAssembly engine dynamically
 */
export async function getPyodideInstance(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Pyodide can only run in the browser environment.");
  }

  if (window.__pyodideInstance) {
    return window.__pyodideInstance;
  }

  if (window.__pyodideLoadingPromise) {
    return window.__pyodideLoadingPromise;
  }

  window.__pyodideLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      if (!window.loadPyodide) {
        const script = document.createElement("script");
        script.src = `${PYODIDE_CDN_URL}pyodide.js`;
        script.async = true;
        document.head.appendChild(script);

        await new Promise((res, rej) => {
          script.onload = res;
          script.onerror = () => rej(new Error("Failed to load Pyodide WebAssembly script"));
        });
      }

      if (!window.loadPyodide) {
        throw new Error("loadPyodide is not available on window.");
      }

      const pyodide = await window.loadPyodide({
        indexURL: PYODIDE_CDN_URL,
      });

      // Initialize stdout/stderr capture script
      await pyodide.runPythonAsync(`
import sys
import io

class OutputCapture:
    def __init__(self):
        self.stdout = io.StringIO()
        self.stderr = io.StringIO()

capture = OutputCapture()
`);

      window.__pyodideInstance = pyodide;
      resolve(pyodide);
    } catch (err) {
      window.__pyodideLoadingPromise = undefined;
      reject(err);
    }
  });

  return window.__pyodideLoadingPromise;
}

/**
 * Execute Python code in the browser with stdout/stderr & plot capture
 */
export async function runPythonCode(code: string): Promise<PythonExecutionResult> {
  const startTime = performance.now();

  try {
    const pyodide = await getPyodideInstance();

    // Check if code uses matplotlib or numpy and load packages
    if (code.includes("matplotlib") || code.includes("plt.")) {
      await pyodide.loadPackage(["matplotlib"]);
    }
    if (code.includes("numpy") || code.includes("np.")) {
      await pyodide.loadPackage(["numpy"]);
    }
    if (code.includes("pandas") || code.includes("pd.")) {
      await pyodide.loadPackage(["pandas"]);
    }

    // Python wrapper script with stdout redirection and plot capture
    const wrappedCode = `
import sys
import io

_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf

_plot_svgs = []

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    _has_plt = True
except ImportError:
    _has_plt = False

_result_val = None
try:
${code
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
    if _has_plt and plt.get_fignums():
        for fig_num in plt.get_fignums():
            fig = plt.figure(fig_num)
            img_buf = io.StringIO()
            fig.savefig(img_buf, format="svg", bbox_inches="tight")
            _plot_svgs.append(img_buf.getvalue())
            plt.close(fig)
except Exception as _e:
    print(f"Error: {_e}", file=sys.stderr)
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr

_out_str = _stdout_buf.getvalue()
_err_str = _stderr_buf.getvalue()
`;

    await pyodide.runPythonAsync(wrappedCode);

    const stdout = pyodide.globals.get("_out_str") || "";
    const stderr = pyodide.globals.get("_err_str") || "";
    const plotSvgsProxy = pyodide.globals.get("_plot_svgs");
    const plots: string[] = plotSvgsProxy ? plotSvgsProxy.toJs() : [];

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      plots,
      executionTimeMs,
      success: !stderr.trim(),
      error: stderr.trim() ? stderr.trim() : undefined,
    };
  } catch (err: any) {
    const executionTimeMs = Math.round(performance.now() - startTime);

    // Fallback simulation for offline/non-wasm test environments
    return {
      stdout: `Execution completed in ${executionTimeMs}ms`,
      stderr: err.message,
      plots: [],
      executionTimeMs,
      success: false,
      error: err.message,
    };
  }
}
