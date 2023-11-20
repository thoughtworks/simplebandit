.PHONY: test, build, format, lint, fix, default

default: build

test:
	npm test
	
build:
	npm run build
	mkdir -p dist/browser
	npx browserify index.ts -p [ tsify --noImplicitAny ] > dist/browser/simpleBandit.js
	npx uglifyjs dist/browser/simpleBandit.js -o dist/browser/simpleBandit.min.js -c -m
	@echo "Lines in simpleBandit.js: `wc -l < dist/browser/simpleBandit.js`"
	@echo "Filesize: `du -sh dist/browser/simpleBandit.min.js`"

format:
	npm run format

lint:
	npm run lint

fix:
	npm run lint:fix




	