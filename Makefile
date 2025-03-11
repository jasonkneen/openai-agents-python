.PHONY: sync
sync:
	npm install

.PHONY: format
format:
	npx prettier --write .

.PHONY: lint
lint:
	npx eslint .

.PHONY: build
build:
	npx tsc

.PHONY: tests
tests:
	npx jest

.PHONY: serve-docs
serve-docs:
	npx serve docs

.PHONY: deploy-docs
deploy-docs:
	npx gh-pages -d docs
