#!/bin/sh
# 不要用 Container Manager 的「构建」。那条路径会并行 bake，停在
# resolving provenance for metadata file。本脚本逐个构建，并关掉证明。
cd "$(dirname "$0")" || exit 1
export BUILDX_NO_DEFAULT_ATTESTATIONS=1
export COMPOSE_BAKE=false
unset OTEL_EXPORTER_OTLP_ENDPOINT OTEL_EXPORTER_OTLP_PROTOCOL \
  OTEL_TRACES_EXPORTER OTEL_METRICS_EXPORTER OTEL_LOGS_EXPORTER

if [ -f server/.env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    key=${line%%=*}
    val=${line#*=}
    case "$val" in
      \"*\") val=${val#\"}; val=${val%\"} ;;
      \'*\') val=${val#\'}; val=${val%\'} ;;
    esac
    export "$key=$val"
  done < server/.env
fi

build_image() {
  dockerfile=$1
  tag=$2
  shift 2
  echo "==> 构建 $tag"
  if docker buildx version >/dev/null 2>&1 && docker buildx build --help 2>&1 | grep -q provenance; then
    docker buildx build --provenance=false --sbom=false --load "$@" -f "$dockerfile" -t "$tag" .
    return
  fi
  docker build "$@" -f "$dockerfile" -t "$tag" .
}

build_image server/Dockerfile bonnote-api:latest || exit 1
build_image client/Dockerfile bonnote-web:latest \
  --build-arg "SEED_DEMO=${SEED_DEMO:-}" \
  --build-arg "DEMO_EMAIL=${DEMO_EMAIL:-}" \
  --build-arg "DEMO_PASSWORD=${DEMO_PASSWORD:-}" || exit 1

# 飞牛上这个目录若是 root 且不可写，MySQL 会报 data directory is unusable。
# 必须和 bonmanage 的 MYSQL_DATA_DIR 分开。
mkdir -p "${MYSQL_DATA_DIR:-./data/mysql}"
chmod 777 "${MYSQL_DATA_DIR:-./data/mysql}"

if docker compose version >/dev/null 2>&1; then
  exec docker compose --env-file server/.env up -d "$@"
fi
if command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose --env-file server/.env up -d "$@"
fi
echo "找不到 docker compose" >&2
exit 1
