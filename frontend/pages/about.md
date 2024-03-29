---
description: What's the point of self-signed certificates? How does this tool help you create them and how was it made?
---

# Why would you want a self-signed certificate?

Self-signed certificates are useful for development, testing, and learning purposes.

Hopefully you're using certificates in production. In that case, also using
them in development and testing means your environment matches production more
which helps find problems earlier in the development process.

For learning how to setup a web server,
it's of course best to use a certificate that's automatically trusted by browser.
If you can't easily get one of those for some reason, then self-signed certificates can still be useful.

# Why this was made

Creating self-signed certificates that work in all browsers is surprisingly tricky.

Unfortunately, a lot of guidance online is out-of-date or simply bad.
They don't use the SAN list extension or don't generate a proper certificate chain.
Using the `commonName` field instead of a SAN list stopped working ages ago, and
Firefox rejects certificates that are simultaneously a leaf and CA certificate.

Someone that doesn't know about these issues could waste a lot of time following bad or outdated instructions or even give up.
This site should make it easy to generate certificates that are accepted in all major, modern browsers.

Because it's a website, you don't have to learn OS specific programs for generating self-signed certificates.

There's other sites that can generate self-signed certificates for you,
but every single one I tried had one or both of the aforementioned problems.

Also, all but one of the sites generated the certificate server-side,
that means they have a copy of the private key that you'll be using.
This can be a bit of a security concern if you end up installing the certificate into your trust store.
There's simply no need for this, keys and certificates can be generated directly inside the browser.

# How this was made

To generate the keys and certificates, C++ is used along with the [Mbed TLS](https://en.wikipedia.org/wiki/Mbed_TLS) library.
This component is compiled into WebAssembly and ran directly inside your browser.
This means the certificates and private keys are completely private to you.
*No server has your private key*, not even momentarily.

The frontend is built in TypeScript using the [Preact library](https://preactjs.com/).

CMake is used to build the C++ project and to invoke esbuild.

This is the complete list of UI/frontend dependencies:
* [@bjorn3/browser_wasi_shim](https://www.npmjs.com/package/@bjorn3/browser_wasi_shim)
* [esbuild](https://www.npmjs.com/package/esbuild)
* [file-saver](https://www.npmjs.com/package/file-saver)
* [highlight.js](https://www.npmjs.com/package/highlight.js)
* [markdown-it](https://www.npmjs.com/package/markdown-it)
* [preact-render-to-string](https://www.npmjs.com/package/preact-render-to-string)
* [preact](https://www.npmjs.com/package/preact)

The site has no server side logic and is currently hosted on GitHub Pages.

At the moment the code is closed-source, but that might change in the future.
