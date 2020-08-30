import fetch from "node-fetch";
import { createWriteStream, ReadStream, unlink } from "fs";

type githubCredentials = {
  client_id: string;
  client_secret: string;
  code: string;
};

const requestGithubToken = (credentials: githubCredentials) =>
  fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  })
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(JSON.stringify(error));
    });

const requestGithubUserAccount = (token: string) =>
  fetch(`https://api.github.com/user?access_token=${token}`)
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(JSON.stringify(error));
    });

export const authorizeWithGithub = async (credentials: githubCredentials) => {
  const { access_token } = await requestGithubToken(credentials);
  const githubUser = await requestGithubUserAccount(access_token);
  return { ...githubUser, access_token };
};

export const uploadStream = (stream: ReadStream, path: string) =>
  new Promise((resolve, reject) => {
    stream
      .on("error", (error) => {
        unlink(path, () => {
          reject(error);
        });
      })
      .on("end", resolve)
      .pipe(createWriteStream(path));
  });
