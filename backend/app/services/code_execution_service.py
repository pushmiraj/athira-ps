import httpx
from typing import Dict

# Using emkc.org's Piston API v2 - Free, no auth required
PISTON_API = "https://emkc.org/api/v2/piston/execute"

# Piston runtime identifiers
LANGUAGE_MAP = {
    "python": "python",
    "javascript": "javascript",
    "java": "java",
    "cpp": "c++",
    "c": "c",
    "go": "go",
    "rust": "rust",
    "ruby": "ruby",
    "php": "php",
    "typescript": "typescript",
}

async def execute_code(language: str, code: str) -> Dict:
    """Execute code using Piston API v2 (emkc.org - free, no auth required)"""
    try:
        runtime = LANGUAGE_MAP.get(language, "python")

        payload = {
            "language": runtime,
            "version": "*",  # Use latest version
            "files": [
                {
                    "content": code
                }
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(PISTON_API, json=payload)

            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"API error ({response.status_code}): {response.text}"
                }

            result = response.json()

            # Piston v2 response structure:
            # - run.stdout: standard output
            # - run.stderr: standard error
            # - run.code: exit code (0 = success)
            # - run.output: combined output
            # - compile.stdout / compile.stderr: compilation output (if applicable)

            run_data = result.get("run", {})
            compile_data = result.get("compile", {})

            stdout = run_data.get("stdout", "").strip()
            stderr = run_data.get("stderr", "").strip()
            exit_code = run_data.get("code", 0)

            compile_stdout = compile_data.get("stdout", "").strip()
            compile_stderr = compile_data.get("stderr", "").strip()

            # Check for compilation errors
            if compile_stderr:
                return {
                    "success": False,
                    "error": f"Compilation Error:\n{compile_stderr}"
                }

            # Check for runtime errors
            if exit_code != 0 and stderr:
                return {
                    "success": False,
                    "error": f"Runtime Error:\n{stderr}"
                }

            # Build successful output
            final_output = stdout if stdout else "Code executed successfully (no output)"

            # Add warnings/info if present
            if stderr and exit_code == 0:
                final_output += f"\n\n⚠️ Stderr:\n{stderr}"

            if compile_stdout:
                final_output += f"\n\n📋 Compiler Info:\n{compile_stdout}"

            return {
                "success": True,
                "output": final_output
            }

    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Code execution timed out (max 30 seconds)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Execution error: {str(e)}"
        }
