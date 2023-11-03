
test:
	jest --onlyChanged --collectCoverage=false
	
browserify:
	npx browserify index.ts -p [ tsify --noImplicitAny ] > simpleBandit.js

format:
	npx prettier --write .

distro:
	tsc
	npx browserify index.ts -p [ tsify --noImplicitAny ] > simpleBandit.js