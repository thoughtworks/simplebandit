
test:
	jest --onlyChanged --collectCoverage=false
	
browserify:
	npx browserify index.ts -p [ tsify --noImplicitAny ] > simpleBandit.js

format:
	npx prettier --write .

dist:
	tsc