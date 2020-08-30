import { PubSub } from "apollo-server-express";
import { Db } from "mongodb";
import fetch from "node-fetch";
import path from "path";
import { User, MutationResolvers, PhotoCategory } from "../types";
import { authorizeWithGithub, uploadStream } from "../lib";

const Mutation: MutationResolvers<{
  db: Db;
  currentUser: User;
  pubsub: PubSub;
}> = {
  githubAuth: async (_parent, { code }, { db, pubsub }) => {
    // 1. GitHubからデータを取得する
    let {
      message,
      access_token,
      avatar_url,
      login,
      name,
    } = await authorizeWithGithub({
      client_id: process.env.CLIENT_ID ?? "",
      client_secret: process.env.CLIENT_SECRET ?? "",
      code,
    });

    // 2. メッセージがある場合は何らかのエラーが発生している
    if (message) {
      throw new Error(message);
    }

    // 3. データをひとつのオブジェクトにまとめる
    let latestUserInfo = {
      name,
      githubLogin: login,
      githubToken: access_token,
      avatar: avatar_url,
    };

    // 4. 新しい情報をもとにレコードを追加したり更新する
    const {
      ops: [user],
      result,
      upsertedId,
    } = await db
      .collection("users")
      .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

    upsertedId && pubsub.publish("user-added", { newUser: user });

    // 5. ユーザーデータとトークンを返す
    return { user, token: access_token };
  },
  postPhoto: async (parent, args, { db, currentUser, pubsub }) => {
    // 1. コンテキストにユーザーがいなければエラーを投げる
    if (!currentUser) {
      throw new Error("only an authorized user can post a photo");
    }

    // 2. 現在のユーザーのIDとphotoを保存する
    const newPhoto = {
      ...args.input,
      userID: currentUser.githubLogin,
      taggedUsers: [],
      category: args.input.category as PhotoCategory,
      created: new Date(),
    };

    // 3. 新しいphotoを追加して、データベースが生成したIDを取得する

    const { insertedIds } = await db.collection("photos").insert(newPhoto);
    const insertedNewPhoto = {
      ...newPhoto,
      id: insertedIds[0],
    };

    const toPath = path.join(
      __dirname,
      "..",
      "assets",
      "photos",
      `${insertedNewPhoto.id}.jpg`
    );

    const { createReadStream } = await args.input.file;
    const stream = createReadStream();
    await uploadStream(stream, toPath);

    // photo-added イベントを購読しているすべてのハンドラに新しい写真の詳細を送信する
    pubsub.publish("photo-added", { newPhoto: insertedNewPhoto });

    return insertedNewPhoto;
  },
  addFakeUsers: async (root, { count }, { db, pubsub }) => {
    var randomUserApi = `https://randomuser.me/api/?results=${count}`;
    var { results } = await fetch(randomUserApi).then((res: any) => res.json());
    var users = results.map((r: any) => ({
      githubLogin: r.login.username,
      name: `${r.name.first} ${r.name.last}`,
      avatar: r.picture.thumbnail,
      githubToken: r.login.sha1,
    }));
    await db.collection("users").insert(users);
    users.map((newUser: User) => {
      pubsub.publish("user-added", { newUser });
    });
    return users;
  },
  fakeUserAuth: async (parent, { githubLogin }, { db }) => {
    var user = await db.collection("users").findOne({ githubLogin });
    if (!user) {
      throw new Error(`Cannot find user with githubLogin "${githubLogin}"`);
    }
    return {
      token: user.githubToken,
      user,
    };
  },
};

export default Mutation;
