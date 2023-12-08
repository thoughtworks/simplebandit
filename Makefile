.PHONY: test, build, format, lint, fix, default

default: build

test:
	npm test
	
build:
	mkdir -p dist/browser
	npm run build
	parcel build examples/index.html --out-dir examples/dist --no-source-maps
	@echo "Lines in simpleBandit.js: `wc -l < dist/browser/simpleBandit.js`"
	@echo "Filesize: `du -sh dist/browser/simpleBandit.min.js`"

format:
	npm run format

lint:
	npm run lint

fix:
	npm run lint:fix

example: build
	cd examples && parcel index.html




	