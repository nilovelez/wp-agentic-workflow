/**
 * Finds out whether a folder holds a WordPress plugin or a theme, from the
 * headers WordPress itself reads:
 *
 * - Plugin: a PHP file in the root with a "Plugin Name:" header.
 * - Theme: a style.css in the root with a "Theme Name:" header.
 *
 * Shared by the scripts of this skill, so all of them recognize a project
 * the same way.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Reads one header ("Text Domain:", "Plugin Name:"...) from the top of a
 * file, or returns null. Headers live in the first 8 KB, as WordPress reads
 * them.
 */
function readHeader( head, header ) {
	const match = head.match( new RegExp( '^[ \\t/*#@]*' + header + ':(.*)$', 'mi' ) );
	return match ? match[ 1 ].trim() : null;
}

function readHead( file ) {
	return readFileSync( file, 'utf8' ).slice( 0, 8192 );
}

/**
 * Returns the plugin in the folder, or null.
 */
function findPlugin( folder ) {
	const phpFiles = readdirSync( folder ).filter( ( file ) => file.endsWith( '.php' ) );
	for ( const file of phpFiles ) {
		const head = readHead( path.join( folder, file ) );
		const name = readHeader( head, 'Plugin Name' );
		if ( ! name ) {
			continue;
		}
		const textDomain = readHeader( head, 'Text Domain' );
		return {
			type: 'plugin',
			name,
			mainFile: file,
			textDomain,
			// Without a Text Domain header, WordPress.org uses the slug,
			// usually also the main file name.
			slug: textDomain || path.basename( file, '.php' ),
		};
	}
	return null;
}

/**
 * Returns the theme in the folder, or null.
 */
function findTheme( folder ) {
	const style = path.join( folder, 'style.css' );
	if ( ! existsSync( style ) ) {
		return null;
	}
	const head = readHead( style );
	const name = readHeader( head, 'Theme Name' );
	if ( ! name ) {
		return null;
	}
	const textDomain = readHeader( head, 'Text Domain' );
	return {
		type: 'theme',
		name,
		mainFile: 'style.css',
		textDomain,
		// Without a Text Domain header, WordPress uses the theme's folder name.
		slug: textDomain || path.basename( folder ),
	};
}

/**
 * Returns { type, name, mainFile, textDomain, slug } for the plugin or theme
 * in the folder, or { error } when it is neither, or both.
 */
export function findProject( folder ) {
	const plugin = findPlugin( folder );
	const theme = findTheme( folder );
	if ( plugin && theme ) {
		return { error: `${ folder } has both a plugin header (${ plugin.mainFile }) and a theme header (style.css): open the plugin or the theme folder, not both` };
	}
	if ( ! plugin && ! theme ) {
		return { error: `${ folder } is neither a plugin (a root PHP file with a "Plugin Name:" header) nor a theme (a root style.css with a "Theme Name:" header)` };
	}
	return plugin || theme;
}
