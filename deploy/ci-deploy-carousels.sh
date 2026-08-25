#!/bin/sh
# Installed on the VPS at /usr/local/bin/ci-deploy-carousels and pinned there by
# authorized_keys, so the CI deploy key has no shell -- the worst it can do is what is
# written here.
#
# The image arrives on stdin as a `docker save` stream. It is built on a GitHub runner
# because this box cannot reach the npm registry: outbound loses 12-60% of its packets and
# `npm ci` never finishes, while inbound to it measures 0% loss.
set -eu

SERVICE=vour-carousels-frontend
PREFIX=vour-carousels-frontend
ENV_FILE=/opt/vour-carousels/.env
NETWORK=dokploy-network
PUBLISH=3003

log() { echo "[deploy] $*"; }

LOADED=$(docker load | sed -n 's/^Loaded image: //p' | head -1)
[ -n "$LOADED" ] || { log "nothing was loaded from stdin"; exit 1; }
log "loaded $LOADED"

# The tag decides what runs and it came from the network, so anything not built for this
# service is refused here rather than trusted.
case "$LOADED" in
  "$PREFIX":*) ;;
  *) log "refusing to deploy '$LOADED' -- expected $PREFIX:<tag>"; exit 1 ;;
esac

# Secrets live on this box and never travel to GitHub, so they are read at deploy time
# rather than injected by the workflow.
[ -r "$ENV_FILE" ] || { log "missing $ENV_FILE"; exit 1; }

# Two loops rather than one, because `docker service create` wants --env and
# `docker service update` wants --env-add, and sh has no arrays to rewrite a flag across a
# saved list. The first attempt round-tripped the arguments through a delimiter to patch
# the flag name, and left an empty "=" entry in the service spec for its trouble.

if docker service inspect "$SERVICE" >/dev/null 2>&1; then
  log "updating existing service"
  set --
  while IFS= read -r line; do
    case "$line" in ''|'#'*) continue ;; esac
    key=${line%%=*}; val=${line#*=}
    case "$key" in *[!A-Za-z0-9_]*|'') continue ;; esac
    [ -n "$val" ] || continue
    val=$(printf '%s' "$val" | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
    set -- "$@" --env-add "$key=$val"
  done < "$ENV_FILE"
  log "applying $(( $# / 2 )) environment values"
  docker service update \
    --image "$LOADED" \
    "$@" \
    --update-order start-first \
    --update-failure-action rollback \
    "$SERVICE"
else
  log "creating service"
  set --
  while IFS= read -r line; do
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
    "$LOADED"
fi

log "replicas: $(docker service ls --filter name=$SERVICE --format '{{.Replicas}}')"
log "done"
