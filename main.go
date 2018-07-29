package main

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi"
)

func main() {
	p := `:3000`
	a := `127.0.0.1`
	r := chi.NewRouter()
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("welcome"))
	})
	r.Get("/login", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("its login"))
	})
	r.Get("/blog", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("its blog"))
	})
	r.Get("/main", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("its main"))
	})
	fmt.Printf("Сервер слушает на адресе %v%v", a, p)
	http.ListenAndServe(p, r)
}
