import { ApolloServer, PubSub } from "apollo-server-express";
import express from "express";
import expressPlayground from "graphql-playground-middleware-express";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";
import { createServer } from "http";
import dotenv from "dotenv";
import path from "path";
import depthLimit from "graphql-depth-limit";
import resolvers from "./resolvers";
const typeDefs = readFileSync("./typeDefs.graphql", "utf-8");

dotenv.config();

async function start() {
  const app = express();
  const MONGO_DB = process.env.DB_HOST;
  const client = await MongoClient.connect(MONGO_DB ? MONGO_DB : "basketch", {
    useNewUrlParser: true,
  });
  const db = client.db();
  const pubsub = new PubSub();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(5)],
    context: async ({ req, connection }) => {
      const githubToken = req
        ? req.headers.authorization
        : // サブスクリプションの場合は HTTP リクエストがないため、req 引数は null になる
          connection?.context.Authorization;
      const currentUser = await db.collection("users").findOne<{
        githubLogin: string;
        name?: string;
        avatar?: string;
        postedPhotos: [];
        inPhotos: [];
      }>({ githubToken });
      return { db, currentUser, pubsub };
    },
  });
  server.applyMiddleware({ app });
  app.get("/", (req, res) => res.end("Welcome to the PhotoShare API"));
  app.get(
    "/playground",
    expressPlayground({
      endpoint: "/graphql",
      subscriptionEndpoint: "/graphql",
    })
  );
  app.use(
    "/img/photos",
    express.static(path.join(__dirname, "assets", "photos"))
  );

  const httpServer = createServer(app);
  server.installSubscriptionHandlers(httpServer);
  httpServer.timeout = 5000;
  httpServer.listen({ port: 4000 }, () =>
    console.log(`GraphQL Server running at localhost:4000${server.graphqlPath}`)
  );
}

start().catch((err) => console.log(err));
