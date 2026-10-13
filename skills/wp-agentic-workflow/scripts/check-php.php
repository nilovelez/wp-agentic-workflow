<?php
/**
 * Checks that the local PHP CLI is ready for the PHP tools of a WordPress
 * plugin: Composer and PHP_CodeSniffer with the WordPress Coding Standards
 * (and WP-CLI, where it is installed on its own instead of using Studio).
 *
 * Usage: php check-php.php
 * Exit code: 0 if every required check passes, 1 otherwise.
 */

const MIN_PHP_VERSION   = '7.4.0';
const MIN_MEMORY_LIMIT  = 256 * 1024 * 1024; // 256M, enough for PHPCS on a plugin.

// Extension => array( required?, tools that need it ).
$extensions = array(
	'phar'      => array( true, 'WP-CLI, Composer' ),
	'json'      => array( true, 'WP-CLI, Composer, PHPCS' ),
	'openssl'   => array( true, 'WP-CLI, Composer (HTTPS downloads)' ),
	'curl'      => array( true, 'WP-CLI, Composer (downloads)' ),
	'mbstring'  => array( true, 'WP-CLI (i18n), Composer' ),
	'zip'       => array( true, 'WP-CLI (dist-archive), Composer (packages)' ),
	'tokenizer' => array( true, 'PHPCS' ),
	'xmlwriter' => array( true, 'PHPCS' ),
	'simplexml' => array( true, 'PHPCS' ),
	'iconv'     => array( false, 'Composer, PHPCS (encoding)' ),
	'intl'      => array( false, 'WP-CLI (some commands)' ),
	'fileinfo'  => array( false, 'WP-CLI (media)' ),
);

/**
 * Converts a php.ini size value (e.g. "128M") to bytes. -1 means no limit.
 */
function to_bytes( $value ) {
	$value = trim( $value );
	if ( '-1' === $value ) {
		return -1;
	}
	$number = (int) $value;
	switch ( strtoupper( substr( $value, -1 ) ) ) {
		case 'G':
			return $number * 1024 * 1024 * 1024;
		case 'M':
			return $number * 1024 * 1024;
		case 'K':
			return $number * 1024;
	}
	return $number;
}

$failed = false;
$fixes  = array();

function report( $ok, $label, $detail, $required = true ) {
	$status = $ok ? 'OK  ' : ( $required ? 'FAIL' : 'WARN' );
	printf( "  [%s] %-20s %s\n", $status, $label, $detail );
}

echo "PHP\n";
$version_ok = version_compare( PHP_VERSION, MIN_PHP_VERSION, '>=' );
report( $version_ok, 'version', PHP_VERSION . ' (min ' . MIN_PHP_VERSION . ')' );
report( true, 'binary', PHP_BINARY );
$ini_file = php_ini_loaded_file();
report( false !== $ini_file, 'php.ini', $ini_file ? $ini_file : 'none loaded (copy php.ini-development to php.ini)' );
$failed = $failed || ! $version_ok || false === $ini_file;

$extension_dir    = ini_get( 'extension_dir' );
$extension_dir_ok = is_dir( $extension_dir );
report( $extension_dir_ok, 'extension_dir', $extension_dir );
if ( ! $extension_dir_ok ) {
	$fixes[] = 'extension_dir = "' . dirname( PHP_BINARY ) . DIRECTORY_SEPARATOR . 'ext"';
	$failed  = true;
}

echo "\nExtensions\n";
foreach ( $extensions as $name => list( $required, $used_by ) ) {
	$loaded = extension_loaded( $name );
	report( $loaded, $name, $used_by, $required );
	if ( ! $loaded ) {
		$fixes[] = "extension={$name}";
		$failed  = $failed || $required;
	}
}

echo "\nLimits\n";
$memory    = to_bytes( ini_get( 'memory_limit' ) );
$memory_ok = -1 === $memory || $memory >= MIN_MEMORY_LIMIT;
report( $memory_ok, 'memory_limit', ini_get( 'memory_limit' ) . ' (min 256M)' );
if ( ! $memory_ok ) {
	$fixes[] = 'memory_limit = 512M';
	$failed  = true;
}
// The CLI ignores max_execution_time (always 0), so it is informative only.
report( true, 'max_execution_time', ini_get( 'max_execution_time' ) . ' (CLI always runs without time limit)' );

if ( $fixes ) {
	echo "\nTo fix, edit {$ini_file} and set (uncomment) these lines:\n";
	foreach ( $fixes as $fix ) {
		echo "  {$fix}\n";
	}
}

echo "\n" . ( $failed ? 'Result: NOT READY' : 'Result: READY' ) . "\n";
exit( $failed ? 1 : 0 );
