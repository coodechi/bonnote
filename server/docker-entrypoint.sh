#!/bin/sh
set -eu
cd /app
export PRISMA_ENGINES_MIRROR="${PRISMA_ENGINES_MIRROR:-https://registry.npmmirror.com/-/binary/prisma}"

attempt=0
until ./node_modules/.bin/prisma migrate deploy
do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "数据库迁移失败"
    exit 1
  fi
  echo "等待数据库就绪..."
  sleep 2
done

./node_modules/.bin/prisma db seed
exec node dist/main.js
