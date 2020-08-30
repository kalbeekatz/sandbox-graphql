import Query from "./Query";
import Mutation from "./Mutation";
import Subscription from "./Subscription";
import Type from "./Type";
import { Resolvers } from "../types";

const resolvers: Resolvers = {
  Query,
  Mutation,
  Subscription,
  ...Type,
};

export default resolvers;
