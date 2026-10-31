#!/usr/bin/env node
/**
 * Prints the address other computers should use to reach a test site on
 * this computer: the Tailscale IP if Tailscale is running, otherwise the
 * local network (LAN) IP.
 *
 * Usage:
 *   node <skill>/scripts/site-address.mjs          The address only.
 *   node <skill>/scripts/site-address.mjs --json   Address, source and all IPs.
 *
 * Run it every time a test site is started: the addresses can change.
 */
import { execSync } from 'node:child_process';
import os from 'node:os';

/**
 * Returns true if an IPv4 address is in 100.64.0.0/10, the range Tailscale uses.
 */
function isTailscaleRange( address ) {
	const parts = address.split( '.' ).map( Number );
	return 100 === parts[ 0 ] && parts[ 1 ] >= 64 && parts[ 1 ] <= 127;
}

/**
 * Asks the Tailscale CLI for this computer's Tailscale IPv4, or returns null.
 */
function tailscaleFromCli() {
	try {
		const output = execSync( 'tailscale ip -4', { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ], timeout: 10000 } );
		const address = output.trim().split( /\s+/ )[ 0 ];
		return isTailscaleRange( address ) ? address : null;
	} catch ( error ) {
		return null;
	}
}

// Every IPv4 address of this computer, except loopback and link-local.
const addresses = [];
const interfaces = os.networkInterfaces();
for ( const name of Object.keys( interfaces ) ) {
	for ( const entry of interfaces[ name ] ) {
		if ( 'IPv4' !== entry.family || entry.internal || entry.address.startsWith( '169.254.' ) ) {
			continue;
		}
		addresses.push( { interface: name, address: entry.address } );
	}
}

// Tailscale first: from its CLI, or from an interface in its range.
let address = tailscaleFromCli();
let source  = 'tailscale';
if ( ! address ) {
	const tailscale = addresses.find( ( entry ) => isTailscaleRange( entry.address ) );
	address = tailscale ? tailscale.address : null;
}

// Otherwise, the first private LAN address.
if ( ! address ) {
	source = 'lan';
	const lan = addresses.find( ( entry ) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test( entry.address ) );
	address = lan ? lan.address : null;
}

if ( process.argv.includes( '--json' ) ) {
	console.log( JSON.stringify( { address, source: address ? source : null, addresses }, null, 2 ) );
} else if ( address ) {
	console.log( address );
} else {
	console.error( 'No Tailscale or LAN IPv4 address found.' );
}

process.exit( address ? 0 : 1 );
