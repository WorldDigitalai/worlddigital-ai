"""Set before the app is imported: the MCP server is only mounted when it has a public address."""
import os

os.environ.setdefault("MCP_PUBLIC_URL", "https://api.test")
