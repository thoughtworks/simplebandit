.PHONY: test, build, format, lint, fix, default

test:
	npm test
	
build:
	npm run build
	npx browserify index.ts -p [ tsify --noImplicitAny ] > simpleBandit.js
	npx uglifyjs simpleBandit.js -o simpleBandit.min.js -c -m
	@echo "Lines in simpleBandit.js: `wc -l < simpleBandit.js`"
	@echo "Filesize: `du -sh simpleBandit.min.js`"

format:
	npm run format

lint:
	npm run lint

fix:
	npm run lint:fix


default: build

	