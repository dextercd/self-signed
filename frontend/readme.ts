export const readmeText = `
# Usage

Assuming you've used the default settings, your zip will contain a certificate
named ca_cert.crt and a certificate named [domain name].crt. You also have the
private keys in corresponding .key files.

All the files are PEM encoded.


## [domain name].crt

This is the end/leaf certificate. This is what should be used by your HTTP
server software.

By default, it's named after the first domain in the SAN list, but the
certificate is valid for all domains you configured in the list. You can of
course also rename it.

The name you use to connect to the HTTP server should match with the names you
configured in the SAN list. You can put \`localhost\` in the certificate or
choose something more custom.

You can edit \`/etc/hosts\` to make a custom hostname resolve to localhost or
your development server. On Windows, this file is located at \`C:\\Windows\\System32\\drivers\\etc\\hosts\`
and you have to launch Notepad as an Administrator to edit it.


## ca_cert.crt

This is the trust anchor certificate the you'll want your client software trust.
That could be your operating system, browser, or a HTTP request library/program.


## Configuring the HTTP server

This is where you'll use the [domain name].crt and [domain name].key files.

- NGINX: https://nginx.org/en/docs/http/configuring_https_servers.html
- Apache: https://httpd.apache.org/docs/current/ssl/ssl_howto.html
- Caddy: https://caddyserver.com/docs/caddyfile/directives/tls
- HAProxy:
    - https://www.haproxy.com/documentation/haproxy-configuration-tutorials/ssl-tls/
    - You must concatenate the certificate and key files. (Key must come last)
- Lighttpd: https://redmine.lighttpd.net/projects/lighttpd/wiki/Docs_SSL
- npx http-server
    - \`npx http-server --tls --cert path/to/[domain name].crt --key path/to/[domain name].key\`
    - https://www.npmjs.com/package/http-server#available-options
- Node.js: https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener
- Kestrel: (HttpsInlineCertAndKeyFile) https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/endpoints#configure-https
- Cowboy:
    - https://ninenines.eu/docs/en/cowboy/2.12/manual/cowboy.start_tls/
    - You can either combine the key and crt file or use the \`keyfile\` option.
    - https://ninenines.eu/docs/en/ranch/2.1/manual/ranch_ssl/
- Gunicorn: https://docs.gunicorn.org/en/stable/settings.html#ssl
- Uvicorn: https://www.uvicorn.org/deployment/#running-with-https
- uWSGI: https://uwsgi-docs.readthedocs.io/en/latest/HTTPS.html#setting-ssl-tls-ciphers


## Installing the CA certificate

This is where you use the ca_cert.crt file.

How to make your system/client trust a certificate varies between the different
software. Most of the time, a client will use your operating system's trust
store, Firefox is a notable exception to this (in its default configuration).

If you don't want to add the certificate to your OS, then there are often ways
to configure just a specific client to trust the certificate.

Operating Systems:
    - Arch Linux: https://wiki.archlinux.org/title/Transport_Layer_Security#Add_a_certificate_to_a_trust_store
    - Windows: https://superuser.com/a/467322
    - macOS:
        - Import: https://support.apple.com/en-gb/guide/keychain-access/kyca2431/mac
        - Trust settings: https://support.apple.com/en-gb/guide/keychain-access/kyca11871/mac

Browsers:
- Firefox:
    - Options > Advanced > Certificates: View Certificates:
        - Go to the Authorities tab and add the certificate there.

    - You can also make Firefox use your OS' trust store:
      https://support.mozilla.org/en-US/kb/setting-certificate-authorities-firefox

- Chrome:
    - Chrome uses your OS trust store.

    - On Linux, Chrome also uses a separate trust store in your home directory.
      You can choose to add your certificate only there instead of system wide.

      Settings > Privacy and Security > Security > Manage certificates:
        - Swap to the Authorities tab and import the certificates.

HTTP Clients:
- cURL:
    - cURL uses your system's trust store.
    - You can use the command line option \`--cacert path/to/ca_cert.crt\` to
      trust the certificate for a single invocation.
    - https://curl.se/docs/sslcerts.html
    - https://curl.se/libcurl/c/CURLOPT_CAINFO.html

- Python requests:
    - https://docs.python-requests.org/en/latest/user/advanced/#ssl-cert-verification

- OpenSSL:
    - \`openssl s_client -verify_return_error -verifyCAfile path/to/ca_cert.crt -crlf -connect localhost:443\`

- Postman:
    - https://learning.postman.com/docs/sending-requests/authorization/certificates/
`.trimStart()
