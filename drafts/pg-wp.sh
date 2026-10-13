#!/usr/bin/env bash
# Runs WP-CLI against a persisted Playground CLI site (`start` mode).
# Usage: pg-wp.sh <site-dir> <plugin-dir> <slug> <wp-cli args...>
set -euo pipefail

site_dir="$1"; plugin_dir="$2"; slug="$3"; shift 3
wp_cli_dir="${WP_CLI_DIR:-C:/wp-cli}"

# Git Bash would rewrite the /wordpress-style VFS paths into Windows paths.
export MSYS_NO_PATHCONV=1

npx -y @wp-playground/cli@latest php \
	--mount-dir-before-install "$site_dir" /wordpress \
	--mount-dir "$plugin_dir" "/wordpress/wp-content/plugins/$slug" \
	--mount-dir "$wp_cli_dir" /tools \
	--wordpress-install-mode=install-from-existing-files-if-needed \
	-- /tools/wp-cli.phar --path=/wordpress "$@" 2> >(grep -v '^npm notice' >&2)
