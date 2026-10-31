# Testing the plugin

Test on a running site before handing work over: a change that builds and passes WPCS can still fail at runtime. Use Playground unless the test needs Studio (see `playground.md`). Prefer measured results ("the form returned `spam`") to guesses.

## With HTTP requests

Most behavior can be tested without a browser: request the page, read what you need, post to the endpoint, check the response. One request per case is quick to repeat after each change. For example, for a form plugin: read the hidden fields from the form page, post to the form's REST endpoint once per case (a human, a bot, a missing field...) and check the status each time.

Keep the cookies:

- **Playground's auto-login** redirects to the same URL until the client keeps its cookie, so a plain `curl -L` loops. Use a cookie jar: `curl -c jar.txt -b jar.txt -L <url>`.
- **Admin pages**: log in by posting to `wp-login.php` (`log`, `pwd`, `wp-submit`, `testcookie=1`) with the cookie jar, then request the admin page with the same jar. Use `curl`, not PowerShell's `Invoke-WebRequest`: its `WebRequestSession` drops the `wp-admin` auth cookie when WordPress sends several `Set-Cookie` headers, and every admin page redirects to the login.

## In a headless browser

For what needs a real browser (JavaScript, dialogs, generated files), write a throwaway script outside the repo (in the scratchpad) with `playwright-core` or `puppeteer-core` driving the installed Chrome, as `templates/assets-src/screenshots.mjs` does: log in as `admin` / `password`, act on the page, read the result. Collect the page's console errors and failed requests too: they show runtime errors that the build doesn't.

- Don't use `chrome --headless --dump-dom` to test asynchronous code (fetch, image decoding, `canvas.toBlob`): it dumps the page at a different point on each run, which looks like a hang in the code under test. Drive the browser with Playwright or Puppeteer, or connect to Chrome's DevTools Protocol (`--remote-debugging-port`) and poll `Runtime.evaluate` until the page reports it is done.
- ES modules need the page served over HTTP, not `file://`.
- Secure-context APIs (`crypto.subtle`, clipboard...) only exist on HTTPS or `localhost`: test those on `http://127.0.0.1:9400`, not on a LAN or Tailscale address.

## Prove a security fix

Show the problem before fixing it and its absence after. Add a throwaway mu-plugin to the test site that feeds the attack to the plugin (for example, a filter returning `</style><script>alert(1)</script>`), request the page, check whether the payload reaches the HTML, apply the fix, check again. Remove the mu-plugin afterwards.

## Read the debug log

With `WP_DEBUG_LOG` on (the blueprint template sets it), PHP notices go to `wp-content/debug.log`. In Playground it lives in the virtual file system, not on disk. The quickest way to read it is a throwaway PHP file in the mounted plugin folder that prints it, requested once and deleted right after. On Studio it is a normal file in the site folder.

## After WordPress or a dependency changes

For a maintenance release, check the plugin against the current WordPress and the current versions of the plugins it depends on:

- **Test old features against the current WordPress**, not the one they were written for. Core changes under old code: since 6.4 new sites redirect attachment pages to the file, since 6.1 lists are made of `core/list-item` blocks.
- **Diff the dependency, don't trust its changelog.** Copy the dependency's folder from the Studio site, update it (`studio wp plugin update <dependency>`), and compare the two folders with `git diff --no-index --stat <old> <new>`. Then search the plugin for every function, hook and class of the dependency it uses, and read only the diffs that could touch them.
