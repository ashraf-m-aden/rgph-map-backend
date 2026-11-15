# ============================================================
#  API RGPH 2024 (Express + Mongoose)
# ============================================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
# Le cluster n'a d'interet que sur une machine dediee : sur l'EC2 partage
# avec les autres apps, un seul worker par conteneur (cf. src/server.js).
ENV USE_CLUSTER=false
ENV PORT=5000

COPY package*.json ./
# Dependances de production uniquement, depuis le lockfile (nodemon exclu).
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Seuls le code et les donnees servies sont embarques : les seeds restent
# dans src/ pour pouvoir etre lances a la main (docker compose exec).
COPY src ./src
COPY data ./data

USER node

EXPOSE 5000

# "localhost" resoudrait en ::1 (IPv6) alors que le serveur ecoute en IPv4
# (app.listen(PORT, '0.0.0.0')) : on vise 127.0.0.1 explicitement.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 1

CMD ["node", "src/server.js"]
