#!/bin/sh
# Installed on the VPS at /usr/local/bin/ci-deploy-carousels and pinned there by
# authorized_keys, so the CI deploy key has no shell -- the worst it can do is what is
# written here.
#
# WHY THIS IS NOT "docker save | ssh" ANY MORE
# The box's uplink drops 12-60% of its outbound packets. That breaks bulk transfers in
# BOTH directions: an inbound transfer still needs the box to send ACKs, and when those
# are the packets being lost the sender's congestion window collapses. Measured 25 Aug
# 2026: under 50 KB/s sustained inbound. A 122 MB image stream never finished, and CI
# died on its 30-minute job timeout three runs running.
#
# So nothing large is transferred any more. The runner rsyncs the build OUTPUT into
# $APP_DIR -- rsync sends only the files that changed and resumes what it started -- and
# the image is assembled here from a base that already lives on this disk. A typical
# deploy moves a few MB instead of 122.
#
# Two modes, dispatched on SSH_ORIGINAL_COMMAND:
#   rsync --server ...   -> write-only rsync into $APP_DIR, via rrsync
#   deploy <40-hex sha>  -> build the image from $APP_DIR and roll the service
set -eu

SERVICE=vour-carousels-frontend
BASE=vour-carousels-base:node22
APP_DIR=/opt/vour-carousels/app
ENV_FILE=/opt/vour-carousels/.env
NETWORK=dokploy-network
PUBLISH=3003
KEEP_IMAGES=3

log() { echo "[deploy] $*"; }

cmd=${SSH_ORIGINAL_COMMAND:-}

# --- rsync mode ------------------------------------------------------------------
# rrsync is rsync's own restricted wrapper. -wo is write-only: it refuses --sender, so
# this key can push files in and never read anything back out of the box.
case "$cmd" in
  "rsync --server "*)
    mkdir -p "$APP_DIR"
    exec /usr/bin/rrsync -wo "$APP_DIR"
    ;;
esac

# --- deploy mode -----------------------------------------------------------------
case "$cmd" in
  "deploy "*) TAG=${cmd#deploy } ;;
  *) log "unknown command"; exit 1 ;;
esac

# The tag names the image that will run, and it arrived over the network, so it is
# checked rather than trusted: a commit sha and nothing else.
case "$TAG" in
  *[!0-9a-f]*|"") log "refusing tag '$TAG' -- expected a 40-character commit sha"; exit 1 ;;
esac
[ "${#TAG}" -eq 40 ] || { log "refusing tag '$TAG' -- expected a 40-character commit sha"; exit 1; }

[ -f "$APP_DIR/server.js" ] || { log "no server.js in $APP_DIR -- rsync the build first"; exit 1; }
[ -r "$ENV_FILE" ] || { log "missing $ENV_FILE"; exit 1; }

IMAGE="$SERVICE:$TAG"
log "building $IMAGE from $APP_DIR"

# $BASE is node:22-bookworm-slim with an empty /app, derived on this box from an earlier
# frontend image. It is never pulled and never shipped: the registry is unreachable from
# here for the same reason CI cannot stream an image in.
docker build -t "$IMAGE" -f - "$APP_DIR" <<DOCKERFILE
FROM $BASE
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY . /app
EXPOSE 3000
CMD ["node", "server.js"]
DOCKERFILE

# Secrets live on this box and never travel to GitHub, so they are read at deploy time
# rather than injected by the workflow.
#
# Two loops rather than one, because `docker service create` wants --env and
# `docker service update` wants --env-add, and sh has no arrays to rewrite a flag across a
# saved list. The first attempt round-tripped the arguments through a delimiter to patch
# the flag name, and left an empty "=" entry in the service spec for its trouble.
#
# `|| [ -n "$line" ]` is not decoration: a .env whose last line has no terminating newline
# loses that line to a bare `read`. The backend's .env was in exactly that state, and an
# appended key was silently glued onto the line before it.

if docker service inspect "$SERVICE" >/dev/null 2>&1; then
  log "updating existing service"
  set --
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    key=${line%%=*}; val=${line#*=}
    case "$key" in *[!A-Za-z0-9_]*|'') continue ;; esac
    [ -n "$val" ] || continue
    val=$(printf '%s' "$val" | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
    set -- "$@" --env-add "$key=$val"
  done < "$ENV_FILE"
  log "applying $(( $# / 2 )) environment values"
  docker service update \
    --image "$IMAGE" \
    "$@" \
    --update-order start-first \
    --update-failure-action rollback \
    "$SERVICE"
else
  log "creating service"
  set --
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    key=${line%%=*}; val=${line#*=}
    case "$key" in *[!A-Za-z0-9_]*|'') continue ;; esac
    [ -n "$val" ] || continue
    val=$(printf '%s' "$val" | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
    set -- "$@" --env "$key=$val"
  done < "$ENV_FILE"
  log "applying $(( $# / 2 )) environment values"
  docker service create \
    --name "$SERVICE" \
    --network "$NETWORK" \
    --publish "published=$PUBLISH,target=3000" \
    --limit-memory 1500M \
    --reserve-memory 384M \
    --restart-condition any \
    "$@" \
    "$IMAGE"
fi

log "replicas: $(docker service ls --filter name=$SERVICE --format '{{.Replicas}}')"

# Every deploy leaves another ~350 MB image behind. Keep the last few for a manual
# rollback and drop the rest; the running one is never untagged because docker refuses.
docker images "$SERVICE" --format '{{.Repository}}:{{.Tag}}' \
  | tail -n +$(( KEEP_IMAGES + 1 )) \
  | while IFS= read -r old; do
      docker rmi "$old" >/dev/null 2>&1 && log "removed $old" || true
    done

log "done"
