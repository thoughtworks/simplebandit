
test:
	npm test
	
build:
	npm run build
	@echo "Lines in simpleBandit.js: `wc -l < simpleBandit.js`"
	@echo "Filesize: `du -sh simpleBandit.min.js`"

format:
	npm run format

lint:
	npm run lint
	