import { Db } from "mongodb";
import { User, QueryResolvers } from "../types";

const Query: QueryResolvers<{ currentUser: User; db: Db }> = {
  me: (parent, args, { currentUser }) => currentUser,
  totalPhotos: (parent, args, { db }) =>
    db.collection("photos").estimatedDocumentCount(),
  allPhotos: (parent, args, { db }) => {
    // if (data.first > 100) {
    //   throw new Error("Only 100 photos can be requested at a time");
    // }
    return db.collection("photos").find().toArray();
  },
  totalUsers: (parent, args, { db }) =>
    db.collection("users").estimatedDocumentCount(),
  allUsers: (parent, args, { db }) => db.collection("users").find().toArray(),
};

export default Query;
