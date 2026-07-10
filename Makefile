.PHONY: dev bootstrap launch-check check smoke screenshot-check bug-bash-check version-scheme-check release-freeze-check capture-screenshots doctor dev-controller test-controller lint-controller dev-frontend build-frontend clean

dev:
	./scripts/dev.sh

bootstrap:
	./scripts/bootstrap.sh

launch-check:
	./scripts/launch-check.sh

check:
	./scripts/check.sh

smoke:
	./scripts/smoke.sh

screenshot-check:
	./scripts/check-screenshots.sh

bug-bash-check:
	./scripts/bug-bash-check.sh

version-scheme-check:
	./scripts/version-scheme-check.sh

release-freeze-check:
	./scripts/release-freeze-check.sh

capture-screenshots:
	./scripts/capture-screenshots.sh

doctor:
	./scripts/doctor.sh

dev-controller:
	cd controller && uvicorn app.main:app --reload --host 127.0.0.1 --port 8787

test-controller:
	cd controller && pytest -q

lint-controller:
	cd controller && ruff check app tests

dev-frontend:
	cd frontend && npm run dev

build-frontend:
	cd frontend && npm run build

clean:
	rm -rf controller/.pytest_cache controller/.ruff_cache frontend/dist


desktop-check:
	cd desktop/electron && npm run check
