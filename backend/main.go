package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

func main() {
	upstream := os.Getenv("UPSTREAM_RESTCONF")
	if upstream == "" {
		log.Fatal("UPSTREAM_RESTCONF is required")
	}

	token := os.Getenv("RESTCONF_TOKEN")
	if token == "" {
		log.Fatal("RESTCONF_TOKEN is required")
	}

	upURL, err := url.Parse(strings.TrimRight(upstream, "/"))
	if err != nil {
		log.Fatal(err)
	}

	client := &http.Client{Timeout: 30 * time.Second}

	log.Println("Backend starting")
	log.Println("Upstream RESTCONF:", upURL.String())

	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		log.Println("Health check")
		w.Write([]byte("ok"))
	})

	http.HandleFunc("/restconf/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("---- Incoming request ----")
		log.Println("Method:", r.Method)
		log.Println("Path:", r.URL.Path)
		log.Println("Query:", r.URL.RawQuery)

		target := *upURL
		target.Path = strings.TrimRight(upURL.Path, "/") +
			strings.TrimPrefix(r.URL.Path, "/restconf")
		target.RawQuery = r.URL.RawQuery

		log.Println("Forwarding to:", target.String())

		req, err := http.NewRequest(r.Method, target.String(), r.Body)
		if err != nil {
			log.Println("Request creation failed:", err)
			http.Error(w, err.Error(), 500)
			return
		}

		// Copy headers (except Authorization)
		for k, v := range r.Header {
			if strings.ToLower(k) == "authorization" {
				continue
			}
			req.Header[k] = v
		}

		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Accept", "application/yang-data+json")

		start := time.Now()
		resp, err := client.Do(req)
		elapsed := time.Since(start)

		if err != nil {
			log.Println("Upstream request failed:", err)
			http.Error(w, err.Error(), 502)
			return
		}
		defer resp.Body.Close()

		log.Println("Upstream response status:", resp.Status)
		log.Println("Upstream response time:", elapsed)

		for k, v := range resp.Header {
			w.Header()[k] = v
		}
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
	})

	log.Println("Listening on :9000")
	log.Fatal(http.ListenAndServe(":9000", nil))
}
