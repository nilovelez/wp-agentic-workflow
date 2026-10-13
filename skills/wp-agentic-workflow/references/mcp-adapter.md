# MCP Adapter on the Studio site

The [MCP Adapter](https://wordpress.org/plugins/mcp-adapter/) exposes the abilities registered with the WordPress Abilities API as MCP tools. It is optional: out of the box it only exposes three read-only core abilities, so WP-CLI (`studio wp`) is still far more useful unless the plugin, or the plugins it works with, register abilities. Set it up when the plugin registers abilities (see the official `wp-abilities-api` skill) or the developer asks for it.

## Set it up

1. Install it on the Studio site:

   ```bash
   studio wp --path <site> plugin install mcp-adapter --activate
   ```

2. Connect Claude Code over STDIO through WP-CLI: no application password, no network.

   ```bash
   claude mcp add --scope local wordpress-studio -- studio wp --path <site> mcp-adapter serve --server=mcp-adapter-default-server --user=admin
   ```

   On Windows `studio` is a `.bat` file, so the command needs `cmd /c` in front:

   ```bash
   claude mcp add --scope local wordpress-studio -- cmd /c studio wp --path <site> mcp-adapter serve --server=mcp-adapter-default-server --user=admin
   ```

   Local scope, because the site path is specific to this computer.

3. Verify it with a fresh headless session, which is cheaper than restarting the current one:

   ```bash
   claude -p "List the tools of the wordpress-studio MCP server" --allowedTools "mcp__wordpress-studio__*"
   ```

New MCP servers are loaded when a session starts: the current session needs a restart to use it.
