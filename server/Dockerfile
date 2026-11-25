FROM node:20-bookworm-slim AS build
WORKDIR /app
# 飞牛 / 群晖直连 deb.debian.org、registry.npmjs.org 会停在元数据下载
RUN set -eux; \
    find /etc/apt -type f \( -name '*.sources' -o -name 'sources.list' -o -name '*.list' \) \
      -exec sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' {} +; \
    printf 'Acquire::http::Timeout "30";\nAcquire::Retries "5";\n' > /etc/apt/apt.conf.d/99timeout; \
    apt-get update; \
    apt-get install -y --no-install-recommends openssl ca-certificates; \
    rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma
COPY server/prisma.config.ts server/env.cjs ./
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
RUN sed -i 's|https://registry.npmjs.org|https://registry.npmmirror.com|g' package-lock.json \
  && npm ci --registry=https://registry.npmmirror.com
COPY server/tsconfig.json server/tsconfig.build.json server/nest-cli.json ./
COPY server/src ./src
RUN npx prisma generate && npm run build

FROM node:20-bookworm-slim
WORKDIR /app
RUN set -eux; \
    find /etc/apt -type f \( -name '*.sources' -o -name 'sources.list' -o -name '*.list' \) \
      -exec sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' {} +; \
    printf 'Acquire::http::Timeout "30";\nAcquire::Retries "5";\n' > /etc/apt/apt.conf.d/99timeout; \
    apt-get update; \
    apt-get install -y --no-install-recommends openssl ca-certificates; \
    rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY server/package.json server/prisma.config.ts server/env.cjs server/tsconfig.json server/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3001
CMD ["./docker-entrypoint.sh"]
