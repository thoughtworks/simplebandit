
test:
	jest --onlyChanged --collectCoverage=false

coverage:
	jest --coverage
	
browserify:
	npx browserify index.ts -p [ tsify --noImplicitAny ] > simpleBandit.js
	npx uglifyjs simpleBandit.js -o simpleBandit.min.js -c -m
	@echo "Lines in simpleBandit.js: `wc -l < simpleBandit.js`"
	@echo "Filesize: `du -sh simpleBandit.min.js`"

format:
	npx prettier --write .

distro:
	tsc
	npx browserify index.ts -p [ tsify --noImplicitAny ] > simpleBandit.js
	npx uglifyjs simpleBandit.js -o simpleBandit.min.js -c -m
	@echo "Lines in simpleBandit.js: `wc -l < simpleBandit.js`"
	@echo "Filesize: `du -sh simpleBandit.min.js`"
	