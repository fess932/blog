package main

// Article is one path of blog
type Article struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Text string `json:"text"`
}
