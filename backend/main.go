package main

import (
	"flag"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
)

// hop-by-hop headers to remove when proxying (RFC 2616 section 13.5.1)
var hopHeaders = []string{
	"Connection",
	"Keep-Alive",
	"Proxy-Authenticate",
	"Proxy-Authorization",
	"TE",
	"Trailers",
	"Transfer-Encoding",
	"Upgrade",
}

func main() {
	listen := flag.String("listen", ":9000", "listen address for proxy")
	upstream := flag.String("upstream", "http://localhost:8080/restconf", "upstream RESTCONF base URL (e.g. http://host:port/restconf)")
	upUser := flag.String("upuser", "", "upstream basic auth username (optional)")
	upPass := flag.String("uppass", "", "upstream basic auth password (optional)")
	forwardAuth := flag.Bool("forward-auth", false, "if true, forward incoming Authorization header to upstream")
	flag.Parse()

	u, err := url.Parse(strings.TrimRight(*upstream, "/"))
	if err != nil {
		log.Fatalf("invalid upstream URL: %v", err)
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Health endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// Proxy handler: forward everything under /restconf/data/ and /restconf/data
	http.HandleFunc("/restconf/data/", makeProxyHandler(client, u, *upUser, *upPass, *forwardAuth))
	http.HandleFunc("/restconf/data", makeProxyHandler(client, u, *upUser, *upPass, *forwardAuth))

	// Optionally allow CORS for local dev (simple permissive handler)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If the path doesn't match known endpoints, return 404
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte("not found"))
	})

	log.Printf("RESTCONF proxy listening on %s -> upstream %s", *listen, u.String())
	if err := http.ListenAndServe(*listen, nil); err != nil {
		log.Fatalf("listen error: %v", err)
	}
}

// makeProxyHandler creates a handler that proxies requests to upstreamBase
func makeProxyHandler(client *http.Client, upstreamBase *url.URL, upUser, upPass string, forwardAuth bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		// Build target URL by appending the incoming path after /restconf to upstreamBase
		// Example: incoming /restconf/data/ietf-interfaces/interfaces -> upstreamBase + /data/ietf-interfaces/interfaces
		// upstreamBase is expected to be the base RESTCONF URL (e.g. http://host:port/restconf)
		incomingPath := strings.TrimPrefix(r.URL.Path, "/restconf")
		targetURL := *upstreamBase // copy
		targetURL.Path = strings.TrimRight(upstreamBase.Path, "/") + incomingPath
		targetURL.RawQuery = r.URL.RawQuery

		// Create upstream request
		var body io.Reader
		if r.Body != nil {
			body = r.Body
		}
		req, err := http.NewRequest(r.Method, targetURL.String(), body)
		if err != nil {
			http.Error(w, "failed to create upstream request: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Copy headers (but remove hop-by-hop headers)
		copyHeaders(r.Header, req.Header)
		for _, h := range hopHeaders {
			req.Header.Del(h)
		}

		// Control Authorization:
		// - If forwardAuth is true and incoming request had Authorization, forward it.
		// - Else, if upUser/upPass provided, set Basic Auth to upstream.
		if !forwardAuth {
			// remove any incoming Authorization (don't forward by default)
			req.Header.Del("Authorization")
		}
		if upUser != "" {
			req.SetBasicAuth(upUser, upPass)
		}

		// Ensure we accept JSON/YANG JSON if not explicitly set
		if req.Header.Get("Accept") == "" {
			req.Header.Set("Accept", "application/yang-data+json, application/json")
		}

		// Debug logging (dump request)
		if dump, err := httputil.DumpRequestOut(req, false); err == nil {
			log.Printf("--> %s %s\n%s", req.Method, req.URL.String(), filterDump(string(dump)))
		}

		// Send request
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "upstream error: "+err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		// Remove hop-by-hop headers from response
		for _, h := range hopHeaders {
			resp.Header.Del(h)
		}

		// Copy response headers and status code
		copyHeaders(resp.Header, w.Header())
		w.WriteHeader(resp.StatusCode)

		// Stream body
		n, _ := io.Copy(w, resp.Body)

		// Log timing
		log.Printf("<-- %s %s %d %dB in %s", r.Method, r.URL.Path, resp.StatusCode, n, time.Since(start))
	}
}

// copyHeaders copies headers from src to dst
func copyHeaders(src http.Header, dst http.Header) {
	for k, vv := range src {
		// Skip the Host header as it is set by http client automatically
		if strings.ToLower(k) == "host" {
			continue
		}
		for _, v := range vv {
			dst.Add(k, v)
		}
	}
}

// filterDump removes full header values that might contain secrets for logs
func filterDump(dump string) string {
	// remove Authorization values from dump for safety
	lines := strings.Split(dump, "\n")
	for i, L := range lines {
		if strings.HasPrefix(strings.ToLower(strings.TrimSpace(L)), "authorization:") {
			lines[i] = "Authorization: REDACTED"
		}
	}
	return strings.Join(lines, "\n")
}
