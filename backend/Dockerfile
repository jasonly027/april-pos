FROM node:24-alpine3.21 as build

WORKDIR /app

COPY package*.json .

RUN npm i --production && npm i typescript

COPY . .

RUN npm run build && npm uninstall typescript

FROM gcr.io/distroless/nodejs22-debian12

COPY --from=build /app /app

WORKDIR /app/dist

ENV PORT=8080

CMD ["index.js"]
