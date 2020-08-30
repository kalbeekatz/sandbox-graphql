import { PubSub } from "apollo-server-express";
import { SubscriptionResolvers } from "../types";

const Subscription: SubscriptionResolvers<{ pubsub: PubSub }> = {
  newPhoto: {
    subscribe: (parent, args, { pubsub }) =>
      // イベントを購読する
      pubsub.asyncIterator("photo-added"),
  },
  newUser: {
    subscribe: (parent, args, { pubsub }) =>
      // イベントを購読する
      pubsub.asyncIterator("user-added"),
  },
};

export default Subscription;
