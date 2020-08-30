import { Db } from "mongodb";
import {
  GraphQLScalarType,
  GraphQLScalarValueParser,
  GraphQLScalarSerializer,
  GraphQLScalarLiteralParser,
  StringValueNode,
} from "graphql";
import { Resolvers } from "../types";

const parseValue: GraphQLScalarValueParser<Date> = (value: string) =>
  new Date(value);
const serialize: GraphQLScalarSerializer<string> = (value) =>
  new Date(value).toISOString();
const parseLiteral: GraphQLScalarLiteralParser<string> = (ast) =>
  (ast as StringValueNode).value;

const Type: Resolvers<{ db: Db }> = {
  // ルートにあるリゾルバはトリビアリゾルバと呼ばれる
  Photo: {
    // まず、トリビアリゾルバのフィールドが呼ばれる
    // ここに定義されてなければフィールドと同じ名前のプロパティのリゾルバを返す
    id: (parent) => parent.id || parent._id || "",
    url: (parent) => `/img/photos/${parent._id}.jpg`,
    postedBy: async (parent, args, { db }) => {
      const user = await db
        .collection("users")
        .findOne({ githubLogin: parent.userID });
      return user ?? {};
    },
  },
  User: {
    postedPhotos: async (parent, args, { db }) => {
      const photos = await db.collection("photos").find().toArray();
      return photos.filter((p) => p.userID === parent.githubLogin);
    },
    inPhotos: async (parent, args, { db }) => {
      const tags = await db.collection("tags").find().toArray();
      const photos = await db.collection("photos").find().toArray();
      return tags
        .filter((tag) => tag.userID === parent.githubLogin)
        .map((tag) => tag.photoID)
        .map((photoID) => photos.find((p) => p.id === photoID));
    },
  },
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "A valid date time value",
    parseValue,
    serialize,
    parseLiteral,
  }),
};

export default Type;
